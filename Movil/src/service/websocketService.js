// WebSocket Service for React Native
const ESP32_IP = '192.168.4.1';
const WS_URL = `ws://${ESP32_IP}/ws`;

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.reconnectInterval = 3000;
  }

  connect() {
    console.log('Connecting to WebSocket...');
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('WebSocket Connected');
      this.broadcast({ type: 'status', value: 'connected' });
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.broadcast(data);
      } catch (err) {
        console.warn('Malformed WS message:', e.data);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket Disconnected. Reconnecting...');
      this.broadcast({ type: 'status', value: 'disconnected' });
      setTimeout(() => this.connect(), this.reconnectInterval);
    };

    this.ws.onerror = (e) => {
      console.error('WebSocket Error:', e.message);
    };
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  broadcast(data) {
    this.listeners.forEach((cb) => cb(data));
  }
}

const instance = new WebSocketService();
export default instance;
