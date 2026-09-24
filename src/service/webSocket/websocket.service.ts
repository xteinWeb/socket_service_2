import WebSocket from 'ws';
import WebSocketManager from './websocketServer';
import { getRecordatorio } from "../../controllers/email/interval.controller";
import { WebSocketTopics, topicActions } from "./ITwebSocket";
import { cambio_estado, historial, listasChats, saveMensajes, status_mensaje } from '../../controllers/CHAT/CHAT.controller';
import { parameterSendEmail, sendMail } from '../../controllers/email/emailer.controller';

const PING_INTERVAL = 30000;

type Room = {
    idRoom: string;
    USER1: any;
    USER2: any;
};

const ROOMS: Room[] = [];

export class WebSocketService {
    private wsManager: WebSocketManager;
    private clientsAlive: Map<WebSocket, boolean> = new Map();
    private clientRooms: Map<WebSocket, Set<string>> = new Map(); // Asociación socket -> salas

    constructor(wsManager: WebSocketManager) {
        this.wsManager = wsManager;
        this.registerHandlers();
        this.startPingPong();
        this.registerConnectionCleanup();
    }

    private registerHandlers(): void {
        this.wsManager.registerHandler(WebSocketTopics.SESSION_STARTED, (data, ws) => this.handleSessionStarted(data, ws));
        this.wsManager.registerHandler(WebSocketTopics.PONG, (_, ws) => this.handlePong(ws));
        this.wsManager.registerHandler(WebSocketTopics.NOTIFICACIONES, (data, ws) => this.handleNotification(data, ws));
        this.wsManager.registerHandler(WebSocketTopics.MENSAJES, (data, ws) => this.handleMensajes(data, ws));
        this.wsManager.registerHandler(WebSocketTopics.EMAIL, (data, ws) => this.handleSendMail(data, ws));
        this.wsManager.registerHandler(WebSocketTopics.CHANGE_STATE, (data, ws) => this.handleChangeState(data, ws));
        this.wsManager.registerHandler(WebSocketTopics.HISTORIAL_NOTIFICACIONES, (data, ws) => this.handleHistorialNotificaiones(data, ws));
        this.wsManager.registerHandler(WebSocketTopics.CHAT_PRIVADO, (data, ws) => this.handlePrivateSendMessage(data, ws));
        this.wsManager.registerHandler(WebSocketTopics.LISTAR_CHATS, (data, ws) => this.listarChats(data, ws));
        this.wsManager.registerHandler(WebSocketTopics.LISTA_MENSAJES, (data, ws) => this.listarMensajes(data, ws));
        // this.wsManager.registerHandler(WebSocketTopics.HISTORIAL_CHAT, (data, ws) => this.handleHistorialChat(data, ws));

        this.wsManager.registerHandler(WebSocketTopics.SESSION_CONTROL, (data, ws) => this.handleSessionControl(data, ws));

    }

    private handleSessionStarted(response: any, ws: WebSocket): void {
        if (response.action === topicActions.GET_DATA_FROM_DB_RECORDATORIOS) {
            getRecordatorio(response.payload, response.action, ws);
        }
    }

    private listarChats(response: any, ws: WebSocket): void {
        if (response.action === topicActions.GET_LISTA_CHATS) {
            listasChats(response.payload.data, ws);
        }
    }

    private listarMensajes(response: any, ws: WebSocket): void {
        if (response.action === topicActions.GET_LISTA_MENSAJES) {
            listasChats(response.payload.data, ws);
            status_mensaje(response.payload.data, ws);
        }
    }

    private handleSessionControl(response: any, ws: WebSocket): void {
        if (response.action !== topicActions.FORCE_DISCONNECT) return;

        const userIdFromPayload = String(response.payload.data.data.DATOS.USUARIO);
        const deviceIdFromPayload = String(response.payload.data.data.DATOS.DEVICEID);

        // ✅ Validación 1: Asegurarse de que haya userId en el payload
        if (!userIdFromPayload && !deviceIdFromPayload) {
            // ws.send(JSON.stringify({
            //     topic: WebSocketTopics.SESSION_CONTROL,
            //     data: `❌ Campo "userId" o "deviceId" faltante en el payload.`,
            // }));
            console.warn(`⚠️ Petición inválida: userId o deviceId faltante en el payload.`);
            return;
        }

        // ✅ Validación 2: Verificar que el socket exista en el registro de clientes
        const clients = this.wsManager.getAllClients();
        const metadata = clients.find(client => client.socket === ws && client.userId === userIdFromPayload && client.deviceId === deviceIdFromPayload);
        debugger;
        if (!metadata) {
            // ws.send(JSON.stringify({
            //     topic: WebSocketTopics.SESSION_CONTROL,
            //     data: `❌ Socket no identificado. No se puede procesar la desconexión.`,
            // }));
            console.warn('⚠️ Socket no identificado en la lista de clientes.');
            return;
        }

        const { userId: userIdFromSocket, deviceId, socket } = metadata;

        // ✅ Validación 3: El socket solo puede desconectar su propio userId
        if (userIdFromSocket !== userIdFromPayload && deviceId !== deviceIdFromPayload) {
            ws.send(JSON.stringify({
                topic: WebSocketTopics.SESSION_CONTROL,
                data: `❌ No autorizado para desconectar a otro usuario.`,
            }));
            console.warn(`🚫 Intento no autorizado de desconexión: ${userIdFromSocket} quiso desconectar a ${userIdFromPayload}`);
            return;
        }

        // ✅ Desconectar todas las sesiones del usuario (todos los dispositivos)
        this.wsManager.disconnectUser(userIdFromSocket, socket, deviceId);

        ws.send(JSON.stringify({
            topic: WebSocketTopics.SESSION_CONTROL,
            data: `✅ Desconexión exitosa del usuario ${userIdFromPayload}`,
        }));

        console.log(`🔌 Usuario ${userIdFromPayload} desconectado correctamente por sí mismo (Device: ${deviceId})`);
    }

    private handleNotification(response: any, ws: WebSocket): void {
        if (response.action === topicActions.GET_DATA_FROM_NOTIFICAIONES) {
            // this.broadcastToAll(WebSocketTopics.NOTIFICACIONES, response.payload.data);

            let USUARIO_REC = response.payload.data.data.USUARIO_REC;
            console.log(USUARIO_REC);
            

            this.sendToUsers(WebSocketTopics.NOTIFICACIONES, response.payload.data, USUARIO_REC);

            if (response.payload.data.data?.SEND_EMAIL) {
                parameterSendEmail(response.payload.data.data, ws);
            }
        }
    }

    private handleMensajes(response: any, ws: WebSocket): void {
        if (response.action === topicActions.GET_DATA_FROM_MENSAJES) {
            let USUARIO_REC = response.payload.data.data.USUARIO_REC;
            this.sendToUsers(WebSocketTopics.MENSAJES, response.payload.data, USUARIO_REC);
            // this.broadcastToAll(WebSocketTopics.MENSAJES, response.payload.data);
        }
    }

    private handleSendMail(response: any, ws: WebSocket): void {
        if (response.action === topicActions.GET_DATA_FROM_EMAIL) {
            sendMail(response.payload.data.data, ws, response.action);
        }
    }

    private handleChangeState(response: any, ws: WebSocket): void {
        if (response.action === topicActions.GET_DATA_CHANGE_STATE) {
            cambio_estado(response.payload.data, ws);
        }
    }

    private handleHistorialNotificaiones(response: any, ws: WebSocket): void {
        if (response.action === topicActions.GET_DATA_HISTORIAL_NOTIFICACIONES) {
            historial(response.payload.data, ws);
        }
    }

    private handleHistorialChat(response: any, ws: WebSocket): void {
        if (response.action === topicActions.GET_DATA_HISTORIAL_CHAT) {
            // historialChats(response.payload.data, ws);
        }
    }

    private async handlePrivateSendMessage(response: any, ws: WebSocket) {

        if (response.action === topicActions.GET_DATA_CHAT_PRIVADO) {
            try {
                const newData: any = await saveMensajes(response.payload.data);
                if (newData?.USUARIO) {
                    
                    let usuarios = JSON.parse(newData.USUARIO);
                    this.sendToUsers(WebSocketTopics.CHAT_RECIVEPRIVADO, newData, usuarios)
                    // setTimeout(() => {
                    //     this.sendToUsers(WebSocketTopics.CHANGE_STATE_MESAJE, newData, [newData.USUARIO_ENV])
                    // }, 1000);
                }
                else
                    console.warn("⚠️ No se encontró 'USUARIO' en la respuesta para enviar mensaje.");
            } catch (err: any) {
                console.error("❌ Error en handlePrivateSendMessage:", err);
            }
        }
    }

    // Enviar mensaje a todos sockets que estén en la sala
    private broadcastToRoom(roomId: string, topic: WebSocketTopics, data: any): void {
        const clients = this.wsManager.getAllClients();

        clients.forEach(clientMetadata => {
            const client = clientMetadata.socket;
            if (
                client.readyState === WebSocket.OPEN &&
                this.clientRooms.get(client)?.has(roomId)
            ) {
                client.send(JSON.stringify({ topic, data }));
            }
        });
    }

    // Emitir mensaje a todos los clientes conectados
    public broadcastToAll(topic: WebSocketTopics, data: any): void {
        const clients = this.wsManager.getAllClients();

        clients.forEach(clientMetadata => {
            const client = clientMetadata.socket;

            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ topic, data }));
            }
        })
    }

    public sendToUsers(topic: WebSocketTopics, data: any, usuariosDestino: string[]): void {
        const clients = this.wsManager.getAllClients();
        const destinoSet = new Set(usuariosDestino);
        clients.forEach(clientMetadata => {
            const { userId, socket } = clientMetadata;
            if (
                destinoSet.has(userId) &&
                socket.readyState === WebSocket.OPEN
            ) {
                console.log('==========userId===========');
                console.log(userId);
                console.log('==========userId===========');
                
                socket.send(JSON.stringify({ topic, data }));
            }
        });
    }


    private handlePong(ws: WebSocket): void {
        this.clientsAlive.set(ws, true);
    }

    private startPingPong(): void {
        setInterval(() => {
            const clients = this.wsManager.getAllClients();

            clients.forEach(clientMetadata => {
                const client = clientMetadata.socket;

                if (client.readyState === WebSocket.OPEN) {
                    if (!this.clientsAlive.has(client)) {
                        this.clientsAlive.set(client, false);
                        client.send(JSON.stringify({ topic: WebSocketTopics.PING }));
                    } else if (!this.clientsAlive.get(client)) {
                        client.terminate();
                        console.log('Connection terminated due to inactivity');
                        this.cleanUpClient(client);
                    } else {
                        this.clientsAlive.set(client, false);
                        client.send(JSON.stringify({ topic: WebSocketTopics.PING }));
                    }
                }
            });
        }, PING_INTERVAL);
    }

    // Registrar limpieza cuando un socket se cierra o da error
    private registerConnectionCleanup(): void {
        const clients = this.wsManager.getAllClients();

        clients.forEach(clientMetadata => {
            const client = clientMetadata.socket;

            client.on('close', () => this.cleanUpClient(client));
            client.on('error', () => this.cleanUpClient(client));
        });
    }

    private cleanUpClient(client: WebSocket): void {
        this.clientsAlive.delete(client);
        this.clientRooms.delete(client);

        // Opcional: eliminar socket de las salas en ROOMS si lo necesitas
        // Actualmente no eliminamos las salas, solo la asociación del cliente
    }
}