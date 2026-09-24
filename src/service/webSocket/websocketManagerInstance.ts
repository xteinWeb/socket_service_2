import { WebSocketService } from './websocket.service';
import WebSocketManager from './websocketServer';
import { Server as HTTPServer } from 'http';

let wsManager: WebSocketManager | null = null;
//let wsService: WebSocketService | null = null;
/**
 * Inicializa el WebSocketManager con el servidor HTTP proporcionado.
 * Si ya está inicializado, retorna la instancia existente.
 * @param server Servidor HTTP para adjuntar WebSocket.
 * @returns Instancia única de WebSocketManager.
 */
export const initWebSocketManager = (server: HTTPServer): WebSocketManager => {
    if (!server) {
        throw new Error('Servidor HTTP inválido para WebSocketManager');
    }
    if (!wsManager) {
        wsManager = new WebSocketManager(server);
        //wsService = new WebSocketService(wsManager);
        console.log('WebSocketManager initialized');
    }
    return wsManager;
};

/**
 * Obtiene la instancia actual del WebSocketManager.
 * @returns Instancia de WebSocketManager o null si no ha sido inicializada.
 */
export const getWebSocketManager = (): WebSocketManager | null => {
    return wsManager;
};

/**
 * Resetea la instancia del WebSocketManager (útil para reiniciar o tests).
 */
export const resetWebSocketManager = (): void => {
    if (wsManager) {
        //wsService = null;
        wsManager = null;
        console.log('WebSocketManager reset');
    }
};
// export const getWebSocketService = (): WebSocketService => {
//     if (!wsService) throw new Error('WebSocketService no ha sido inicializado');
//     return wsService;
// };
