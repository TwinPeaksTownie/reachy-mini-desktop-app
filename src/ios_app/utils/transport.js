import { useConnectionStore } from '../store/useConnectionStore';
import { DAEMON_CONFIG } from '../../config/daemon';

/**
 * Transport Adapter
 * Abstracts the communication layer to support both WiFi (HTTP) and BLE.
 */
export const transport = {
    /**
     * Generic request method that routes based on connection mode
     * @param {string} endpoint - API endpoint (e.g., '/api/state/full')
     * @param {object} options - Fetch options (method, body, etc.)
     * @param {number} timeoutMs - Timeout in milliseconds
     * @returns {Promise<Response>} - Standard Response object (polyfill for BLE)
     */
    request: async (endpoint, options = {}, timeoutMs = 5000) => {
        const { connectionMode } = useConnectionStore.getState();

        if (connectionMode === 'BLE') {
            return transport.requestBle(endpoint, options, timeoutMs);
        } else {
            return transport.requestWifi(endpoint, options, timeoutMs);
        }
    },

    /**
     * WiFi Implementation (Standard Fetch)
     */
    requestWifi: async (endpoint, options, timeoutMs) => {
        const baseUrl = DAEMON_CONFIG.ENDPOINTS.BASE_URL;
        const url = `${baseUrl}${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout (${timeoutMs}ms)`);
            }
            throw error;
        }
    },

    /**
     * BLE Implementation (Placeholder)
     * To be implemented with @tauri-apps/plugin-bluetooth
     */
    requestBle: async (endpoint, options, timeoutMs) => {
        // TODO: Implement BLE transport
        // 1. Serialize request (method, endpoint, body)
        // 2. Write to Write Characteristic
        // 3. Wait for notification on Read Characteristic
        // 4. Deserialize response
        console.warn('BLE Transport not yet implemented, falling back to mock failure');
        throw new Error('BLE Transport not implemented');
    }
};
