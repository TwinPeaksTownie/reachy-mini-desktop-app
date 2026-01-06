#!/bin/bash

# setup-server-gpi.sh
# Automates the setup of GPi Case II (CM4) as a Reachy Mini Server & Kiosk
# Usage: sudo ./setup-server-gpi.sh

set -e

# Target Username
TARGET_USER="reachy"
HOME_DIR="/home/$TARGET_USER"

echo "=== Reachy Mini GPi Server Setup (User: $TARGET_USER) ==="

# 1. System Updates & Dependencies
echo "[1/7] Updating System & Installing Dependencies..."
apt-get update && apt-get upgrade -y
apt-get install -y \
    xserver-xorg \
    xinit \
    openbox \
    chromium \
    nginx \
    python3-pip \
    python3-venv \
    git \
    unclutter \
    pulseaudio \
    unzip \
    wget \
    ffmpeg \
    libportaudio2 \
    libasound2-dev

# 2. GPi Case II Screen & Safe Shutdown
echo "[2/7] Configuring Display and Native Safe Shutdown..."
cd /tmp
rm -rf GPiCase2-Display-Patch*

# Download Display Patch (Directly to avoid Git issues)
if wget https://github.com/RetroFlag/GPiCase2-Display-Patch/archive/refs/heads/master.zip -O display_patch.zip || wget https://github.com/RetroFlag/GPiCase2-Display-Patch/archive/refs/heads/main.zip -O display_patch.zip; then
    unzip -o display_patch.zip
    cd GPiCase2-Display-Patch-* # Catch either master or main
    
    # Apply Display Config
    CONFIG_PATH="/boot/firmware/config.txt"
    if [ ! -f "$CONFIG_PATH" ]; then CONFIG_PATH="/boot/config.txt"; fi
    
    cp -f patch_files/config_GPiCase2.txt "$CONFIG_PATH"
    echo "Display patch applied to $CONFIG_PATH"

    # NATIVE SAFE SHUTDOWN (The clean way for OS Lite)
    # Instead of installing gaming scripts, we use the Raspberry Pi Kernel's built-in 
    # shutdown overlay. This is faster, uses zero CPU, and is OS-agnostic.
    # GPi Case 2 uses GPIO 26 for the power switch.
    if ! grep -q "gpio-shutdown,gpio_pin=26" "$CONFIG_PATH"; then
        echo "dtoverlay=gpio-shutdown,gpio_pin=26,active_low=0,gpio_pull=up" >> "$CONFIG_PATH"
        echo "Native Safe Shutdown configured on GPIO 26."
    fi
else
    echo "ERROR: Could not download display patch. Please check internet connection."
fi

# 3. Python Backend Setup
echo "[3/7] Setting up Python Environment..."
mkdir -p "$HOME_DIR/reachy-daemon"
cd "$HOME_DIR/reachy-daemon"

# Create venv if not exists
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate and install deps
source venv/bin/activate
pip install --upgrade pip
pip install reachy-mini reachy_mini_dances_library pyserial numpy opencv-python sounddevice soundfile librosa yt-dlp

# Create Systemd Service
echo "[4/7] Creating Daemon Service..."
cat <<EOF > /etc/systemd/system/reachy-daemon.service
[Unit]
Description=Reachy Mini Robot Daemon
After=network.target

[Service]
User=$TARGET_USER
WorkingDirectory=$HOME_DIR/reachy-daemon
ExecStart=$HOME_DIR/reachy-daemon/venv/bin/python main.py --fastapi-host 0.0.0.0 --fastapi-port 5000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable reachy-daemon

# 4. Web Server Setup (Nginx)
echo "[5/7] Configuring Nginx..."
rm -f /etc/nginx/sites-enabled/default

cat <<EOF > /etc/nginx/sites-available/reachy-app
server {
    listen 80;
    server_name _;
    root $HOME_DIR/reachy-web;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/reachy-app /etc/nginx/sites-enabled/
mkdir -p "$HOME_DIR/reachy-web"
chown -R $TARGET_USER:$TARGET_USER "$HOME_DIR/reachy-web"

# Fix permissions to allow Nginx to access the web folder
chmod 755 $HOME_DIR
chmod -R 755 "$HOME_DIR/reachy-web"

# 5. Kiosk Mode Setup (Openbox)
echo "[6/7] Configuring Kiosk Mode..."
mkdir -p "$HOME_DIR/.config/openbox"

cat <<EOF > "$HOME_DIR/.config/openbox/autostart"
# Disable screen saver/power management
xset s off
xset -dpms
xset s noblank

# Hide cursor when inactive
unclutter -idle 0.1 &

# Start Chromium in Kiosk Mode
# Check which chromium command exists
if command -v chromium &> /dev/null; then
    CHROME_CMD="chromium"
else
    CHROME_CMD="chromium-browser"
fi

$CHROME_CMD \
    --no-first-run \
    --kiosk \
    --app=http://localhost \
    --disable-restore-session-state \
    --disable-infobars \
    --start-maximized &
EOF

chown -R $TARGET_USER:$TARGET_USER "$HOME_DIR/.config"

# 6. Final login configuration
echo "[7/7] Auto-start X11 on login..."
BASH_PROF="$HOME_DIR/.bash_profile"
if [ ! -f "$BASH_PROF" ]; then touch "$BASH_PROF"; fi

if ! grep -q "startx" "$BASH_PROF"; then
    echo '[[ -z $DISPLAY && $XDG_VTNR -eq 1 ]] && startx -- -nocursor' >> "$BASH_PROF"
    chown $TARGET_USER:$TARGET_USER "$BASH_PROF"
fi

echo "=== Setup Complete! ==="
echo "Next Steps:"
echo "1. Run this on your Mac to copy the web app: scp -r dist-web/* reachy@laura-gameboy.local:/home/reachy/reachy-web/"
echo "2. Copy your Python 'main.py' to /home/reachy/reachy-daemon/"
echo "3. sudo reboot"
