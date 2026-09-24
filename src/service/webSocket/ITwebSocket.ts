import { WebSocket as WS } from 'ws';
export type MessageHandler = (data: any, ws: WS) => void;

export enum WebSocketTopics {
    SESSION_STARTED = 'session_started',
    PONG = 'pong',
    PING = 'ping',
    NOTIFICACIONES = 'notificaciones',
    MENSAJES = 'mensajes_actividad',
    EMAIL = 'email',
    CHANGE_STATE = 'change_state',
    HISTORIAL_NOTIFICACIONES = 'historial_notificaciones',
    HISTORIAL_CHAT = 'historial_chat',
    CHAT_PRIVADO = 'privateSendMessage',
    CHAT_RECIVEPRIVADO = 'privateReveiceMessage',
    LISTAR_CHATS = 'listar_chats',
    LISTA_MENSAJES = 'listar_mensajes',
    CHANGE_STATE_MESAJE = 'change_state_mesaje',
    CHANGE_SAVE_MESAJE = 'change_save_mesaje',


    SESSION_CONTROL = 'SESSION_CONTROL',
};

export enum topicActions {
    GET_DATA_FROM_DB_RECORDATORIOS = 'get_data_recodatorio',
    GET_DATA_FROM_NOTIFICAIONES = 'get_data_notificaciones',
    GET_DATA_FROM_MENSAJES = 'get_data_mensajes_actividad',
    GET_DATA_FROM_EMAIL = 'get_data_email',
    GET_DATA_CHANGE_STATE = 'get_data_change_state',
    GET_DATA_HISTORIAL_NOTIFICACIONES = 'get_data_historial_notificaciones',
    GET_DATA_HISTORIAL_CHAT = 'get_data_historial_chat',
    GET_DATA_CHAT_PRIVADO = 'get_data_chat_privado',
    GET_LISTA_CHATS = 'get_lista_chats',
    GET_LISTA_MENSAJES = 'get_lista_mensajes',
    GET_DATA_CHANGE_STATE_MESAJE = 'get_data_change_state_mesaje',
    GET_DATA_SAVE_STATE_MESAJE = 'get_data_save_state_mesaje',

    FORCE_DISCONNECT = 'force_disconnect',
}

export interface TopicHandlers {
    [topic: string]: MessageHandler;
}
