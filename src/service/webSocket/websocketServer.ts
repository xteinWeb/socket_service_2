import { Server as HTTPServer } from 'http';
import WebSocket, { Server as WebSocketServer, WebSocket as WS } from 'ws';
import { TopicHandlers, MessageHandler, WebSocketTopics } from "./ITwebSocket";
import { getRecordatorio } from '../../controllers/email/interval.controller';
import { sendMail } from '../../controllers/email/emailer.controller';

type ConnectionMetadata = {
    socket: WS;
    userId: string;
    deviceId: string;
    lastPing: number;
};

class WebSocketManager {
    private wss: WebSocketServer;
    public clients: Map<string, Set<ConnectionMetadata>>;
    private topicHandlers: TopicHandlers;
    private heartbeatInterval: NodeJS.Timeout;


    constructor(server: HTTPServer) {
        if (!server) {
            throw new Error("HTTP server must be provided to WebSocketManager.");
        }

        this.wss = new WebSocketServer({ server });
        this.clients = new Map();
        this.topicHandlers = {};

        this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));

        // Activar heartbeat cada 30 segundos
        this.heartbeatInterval = setInterval(() => this.checkHeartbeats(), 30000);
    }

    private handleConnection(ws: WS, req: any): void {
        const url = req.url || '';
        const params = new URLSearchParams(url.replace('/ws/', ''));
        const userId = params.get('userId') || params.get('userIdChangePass');
        const deviceId = params.get('deviceId');

        if (!userId || !deviceId) {
            ws.close();
            return;
        }

        const metadata: ConnectionMetadata = {
            socket: ws,
            userId,
            deviceId,
            lastPing: Date.now()
        };

        if (!this.clients.has(userId)) {
            this.clients.set(userId, new Set());
        }

        this.clients.get(userId)!.add(metadata);

        console.log(`✅ User ${userId} connected (${this.clients.get(userId)!.size} connections) [Device: ${deviceId}]`);

        ws.on('message', (message) => {
            metadata.lastPing = Date.now(); // update last activity
            this.handleMessage(userId, message);
        });

        ws.on('pong', () => {
            metadata.lastPing = Date.now();
        });

        ws.on('close', () => this.handleDisconnect(userId, ws));
        ws.on('error', (err) => {
            console.error(`WebSocket error for user ${userId}:`, err);
            this.handleDisconnect(userId, ws);
        });
    }



    private handleMessage(userId: string, message: WebSocket.Data): void {
        try {
            const { topic, data } = JSON.parse(message.toString());
            const handler = this.topicHandlers[topic];
            if (handler) {
                const connections = this.clients.get(userId);
                if (connections) {
                    connections.forEach(({ socket }) => {
                        handler(data, socket);
                    });
                }
            } else {
                console.log(`No handler for topic ${topic}`);
            }
        } catch (error) {
            console.error('Failed to process message', error);
        }
    }

    private handleDisconnect(userId: string, ws: WS): void {
        const userConnections = this.clients.get(userId);
        if (userConnections) {
            for (const meta of userConnections) {
                if (meta.socket === ws) {
                    userConnections.delete(meta);
                    break;
                }
            }

            if (userConnections.size === 0) {
                this.clients.delete(userId);
                console.log(`User ${userId} fully disconnected`);
            } else {
                console.log(`User ${userId} disconnected one session (${userConnections.size} remaining)`);
            }
        }

        getRecordatorio({}, 'userDisconnect', '');
    }

    private checkHeartbeats(): void {
        const now = Date.now();
        const timeout = 60000; // 1 minuto sin respuesta = muerto

        for (const [userId, connections] of this.clients.entries()) {
            for (const meta of connections) {
                if (now - meta.lastPing > timeout) {
                    console.log(`Connection for user ${userId} timed out. Closing socket.`);
                    meta.socket.terminate(); // Forzar cierre
                    connections.delete(meta);
                } else {
                    meta.socket.ping(); // enviar ping
                }
            }

            if (connections.size === 0) {
                this.clients.delete(userId);
                console.log(`User ${userId} removed due to heartbeat timeout`);
            }
        }
    }


    public sendNotification(userId: string, notification: any): void {
        this.sendMessage(userId, 'notification', notification);
    }

    public sendMessage(userId: string, topic: string, data: any): void {
        const connections = this.clients.get(userId);
        if (!connections) return;

        const message = JSON.stringify({ topic, data });

        for (const { socket } of connections) {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(message);
            }
        }
    }

    public sendToUsers(topic: WebSocketTopics, data: any, usuariosDestino: string[]): void {
        const clients = this.getAllClients();
        const destinoSet = new Set(usuariosDestino);

        clients.forEach(clientMetadata => {
            const { userId, socket } = clientMetadata;

            if (
                destinoSet.has(userId) &&
                socket.readyState === WebSocket.OPEN
            ) {
                socket.send(JSON.stringify({ topic, data }));
            }
        });
    }


    public disconnectUser(userId: string, socket: WebSocket, deviceId: string): void {
        const connections = this.clients.get(userId);
        if (!connections) return;

        for (const meta of connections) {
            if (meta.socket === socket && meta.deviceId === deviceId && meta.userId === userId) {
                meta.socket.close();
                connections.delete(meta);
                console.log(`🔌 Conexión cerrada para userId=${userId}, deviceId=${deviceId}`);
                break;  // Asumiendo que solo hay una conexión así
            }
        }

        // Si ya no quedan conexiones para el usuario, lo eliminamos
        if (connections.size === 0) {
            this.clients.delete(userId);
            console.log(`User ${userId} fully disconnected (no remaining connections)`);
        }
    }

    public registerHandler(topic: string, handler: MessageHandler): void {
        this.topicHandlers[topic] = handler;
    }

    public getAllClients(): ConnectionMetadata[] {
        const allClients: ConnectionMetadata[] = [];
        for (const setClients of this.clients.values()) {
            allClients.push(...setClients);
        }
        return allClients;
    }

    public shutdown(): void {
        clearInterval(this.heartbeatInterval);
        this.wss.close();
    }
}

export default WebSocketManager;

