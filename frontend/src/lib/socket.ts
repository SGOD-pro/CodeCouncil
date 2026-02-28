// lib/socket.ts — WebSocket client (Step 1)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;

class SocketClient {
    private ws: WebSocket | null = null;
    private listeners: Map<string, Listener[]> = new Map();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private url = "";

    connect(url: string) {
        this.url = url;
        try {
            this.ws = new WebSocket(url);
            this.ws.onopen = () => console.log(`[CodeCouncil] WebSocket connected → ${url}`);
            this.ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data as string);
                    this._emit(data.type, data);
                } catch { /* ignore malformed frames */ }
            };
            this.ws.onclose = () => {
                // Auto-reconnect after 2s
                this.reconnectTimer = setTimeout(() => this.connect(this.url), 2000);
            };
            this.ws.onerror = () => { /* handled by onclose */ };
        } catch { /* WebSocket not available (SSR) */ }
    }

    disconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.ws?.close();
        this.ws = null;
    }

    send(data: object) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    on(event: string, cb: Listener) {
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event)!.push(cb);
    }

    off(event: string, cb: Listener) {
        const arr = this.listeners.get(event);
        if (arr) this.listeners.set(event, arr.filter((f) => f !== cb));
    }

    private _emit(event: string, data: unknown) {
        this.listeners.get(event)?.forEach((cb) => cb(data));
    }
}

// Singleton — shared across the app
export const socket = new SocketClient();
