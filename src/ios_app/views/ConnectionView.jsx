import React, { useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, IconButton } from '@mui/material';
import { useConnectionStore } from '../store/useConnectionStore';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiIcon from '@mui/icons-material/Wifi';
import BluetoothIcon from '@mui/icons-material/Bluetooth';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { DAEMON_CONFIG } from '../../config/daemon';
import useAppStore from '../../store/useAppStore';

/**
 * Connection Screen (iOS Entry Point)
 * Allows selecting a robot via WiFi or Bluetooth
 */
function ConnectionView() {
    const {
        isScanning,
        startScanning,
        stopScanning,
        discoveredRobots,
        isConnecting,
        setIsConnecting,
        setIsConnected,
        setRobotIp,
        setConnectionMode,
        addDiscoveredRobot
    } = useConnectionStore();

    const { startDaemon } = useAppStore(); // We'll hijack this to "start" the app flow

    // Mock Scanning Effect
    useEffect(() => {
        if (isScanning) {
            const timer = setTimeout(() => {
                // Mock finding a robot
                addDiscoveredRobot({
                    id: 'reachy-mock-1',
                    name: 'Reachy Mini (Office)',
                    ip: '192.168.1.42',
                    signal: 90,
                    type: 'WIFI'
                });
                stopScanning();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isScanning, addDiscoveredRobot, stopScanning]);

    const handleConnect = async (robot) => {
        setIsConnecting(true);
        setRobotIp(robot.ip);
        setConnectionMode(robot.type);

        // Simulate connection Handshake
        try {
            // TODO: Use transport layer to verify connection
            await new Promise(resolve => setTimeout(resolve, 1500));

            // SUCCESS: Mark as connected to switch view in main.jsx
            setIsConnected(true);

            // Also trigger the app-level active state so 3D view renders
            // In this context, we don't actually start the daemon process,
            // but we need to signal that we are "active" to the rest of the app
            useAppStore.getState().setIsActive(true);

        } catch (e) {
            console.error("Connection failed", e);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <Box sx={{
            height: '100vh',
            width: '100vw',
            bgcolor: '#F5F5F7', // Apple light grey
            display: 'flex',
            flexDirection: 'column',
            pt: 8,
            px: 3
        }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1d1d1f' }}>
                Connect to Reachy
            </Typography>
            <Typography variant="body1" sx={{ color: '#86868b', mb: 4 }}>
                Select a device to start controlling
            </Typography>

            {/* Device List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                {discoveredRobots.map((robot) => (
                    <Paper
                        key={robot.id}
                        elevation={0}
                        onClick={() => handleConnect(robot)}
                        sx={{
                            p: 2,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: 'white',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:active': { transform: 'scale(0.98)' }
                        }}
                    >
                        {/* Icon */}
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: '#F5F5F7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                        }}>
                            {robot.type === 'WIFI' ? <WifiIcon sx={{ color: '#FF9500' }} /> : <BluetoothIcon sx={{ color: '#007AFF' }} />}
                        </Box>

                        {/* Info */}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 600 }}>
                                {robot.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#34C759' }} />
                                <Typography variant="caption" sx={{ color: '#86868b' }}>
                                    Ready to connect
                                </Typography>
                            </Box>
                        </Box>

                        {/* Action */}
                        {isConnecting ? <CircularProgress size={24} /> : <ArrowForwardIcon sx={{ color: '#C7C7CC' }} />}
                    </Paper>
                ))}

                {discoveredRobots.length === 0 && !isScanning && (
                    <Box sx={{ textAlign: 'center', mt: 8, opacity: 0.5 }}>
                        <Typography>No robots found</Typography>
                    </Box>
                )}
            </Box>

            {/* Scan Button */}
            <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={startScanning}
                disabled={isScanning || isConnecting}
                startIcon={isScanning ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                sx={{
                    bgcolor: '#FF9500', // Reachy Orange
                    color: 'white',
                    borderRadius: 3,
                    py: 2,
                    mb: 6,
                    fontSize: 17,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(255, 149, 0, 0.3)',
                    '&:hover': { bgcolor: '#E08500' }
                }}
            >
                {isScanning ? 'Scanning...' : 'Scan for Devices'}
            </Button>
        </Box>
    );
}

export default ConnectionView;
