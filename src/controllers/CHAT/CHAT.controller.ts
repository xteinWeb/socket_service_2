import { getConnectionEmpresa, Mssql } from "../../database/connectionEmpresa";
import WebSocket from 'ws';
import { WebSocketTopics } from "../../service/webSocket/ITwebSocket";

export const save = async (req: any, res: any) => {
    const empresaDato = req.body.prmConexion;
    try {
        const pool = await getConnectionEmpresa(empresaDato.EMPRESA, req.body.prmAccion);
        const result = pool.request()
            .input("ACCION", Mssql.VarChar(50), req.body.prmAccion)
            .input("DATA_JSON", Mssql.VarChar, req.body.prmDatos)
            .execute("spMensajeria").then(function (recordSet: any) {
                let refresh = undefined;
                if (process.env.NEWTOKEN != '')
                    refresh = process.env.NEWTOKEN;
                res.json({
                    data: recordSet.recordset[0]["DATOS"],
                    token: refresh,
                });
            })
            .catch((err: any) => {
                console.warn(err);
                res.json(JSON.stringify([{ ErrMensaje: err.originalError.info.message }]));
            })

    } catch (err) {
        res.status(400).json({ message: err })
    }
};

export const saveMensajes = async (req: any): Promise<any> => {
    try {
        const pool = await getConnectionEmpresa(req.EMPRESA, req.ACCION);
        const result = await pool.request()
            .input("ACCION", Mssql.VarChar(50), req.ACCION)
            .input("DATA_JSON", Mssql.VarChar, JSON.stringify(req.data.DATOS))
            .execute("spMensajeria")

        const dataRes = JSON.parse(result.recordset[0]["DATOS"]);
        return dataRes[0];
    } catch (err: any) {
        console.warn(err);
        return { message: err }
    }
};

export const historial = async (req: any, ws: WebSocket) => {
    let response = req;
    try {
        const pool = await getConnectionEmpresa(response.EMPRESA, response.ACCION);
        const result = pool.request()
            .input("ACCION", Mssql.VarChar(50), response.ACCION)
            .input("DATA_JSON", Mssql.VarChar, JSON.stringify(response.data.DATOS))
            .execute("spMensajeria").then(function (recordSet: any) {
                let refresh = undefined;
                if (process.env.NEWTOKEN != '')
                    refresh = process.env.NEWTOKEN;
                if (response.ACCION === 'HISTORICO NOTIFICACION')
                    ws.send(JSON.stringify({
                        topic: 'historial_notificaciones', data: recordSet.recordset[0]["DATOS"]
                    }));

            })
            .catch((err: any) => {
                console.warn(err);
                ws.send(JSON.stringify({
                    topic: 'error', data: err.originalError.info.message
                }));
            })

    } catch (err) {
        console.warn(err);
        ws.send(JSON.stringify({
            topic: 'error', data: err
        }));
    }
};

export const listasChats = async (req: any, ws: WebSocket) => {
    let response = req;
    try {
        const pool = await getConnectionEmpresa(response.EMPRESA, response.ACCION);
        const result = pool.request()
            .input("ACCION", Mssql.VarChar(50), response.ACCION)
            .input("DATA_JSON", Mssql.VarChar, JSON.stringify(response.data.DATOS))
            .execute("spMensajeria").then(function (recordSet: any) {
                let refresh = undefined;
                if (process.env.NEWTOKEN != '')
                    refresh = process.env.NEWTOKEN;
                if (response.ACCION === 'LISTAR CHATS') {
                    ws.send(JSON.stringify({
                        topic: 'listar_chats', data: recordSet.recordset[0]["DATOS"]
                    }));

                } else if (response.ACCION === 'LISTAR MENSAJES') {
                    ws.send(JSON.stringify({
                        topic: 'listar_mensajes', data: recordSet.recordset[0]["DATOS"]
                    }));
                };

            })
            .catch((err: any) => {
                console.warn(err);
                ws.send(JSON.stringify({
                    topic: 'error', data: err.originalError.info.message
                }));
            })

    } catch (err) {
        console.warn(err);
        ws.send(JSON.stringify({
            topic: 'error', data: err
        }));
    }
};

export const cambio_estado = async (req: any, ws: WebSocket) => {
    let response = req;
    switch (response.data.TIPO) {
        case 'NOTIFICACION':
            response.data.DATOS.USUARIO_ENV = response.data.DATOS.USUARIO_ENV.USUARIO;
            response.data.DATOS.USUARIO_REC = response.data.DATOS.USUARIO_REC[0];
            break;

        default:
            break;
    }
    try {
        const pool = await getConnectionEmpresa(response.EMPRESA, response.ACCION);
        const result = pool.request()
            .input("ACCION", Mssql.VarChar(50), response.ACCION)
            .input("DATA_JSON", Mssql.VarChar, JSON.stringify(response.data))
            .execute("spMensajeria").then(function (recordSet: any) {
                let refresh = undefined;
                if (process.env.NEWTOKEN != '')
                    refresh = process.env.NEWTOKEN;

                if (response.data.TIPO === 'NOTIFICACION') {
                    ws.send(JSON.stringify({
                        topic: 'change_of_status', data: recordSet.recordset[0]["DATOS"]
                    }));

                } else if (response.data.TIPO === 'MENSAJE') {
                    ws.send(JSON.stringify({
                        topic: 'change_status_mensaje', data: recordSet.recordset[0]["DATOS"]
                    }));
                }
            })
            .catch((err: any) => {
                console.warn(err);
            })

    } catch (err) {
    }
};
export const status_mensaje = async (req: any, ws: WebSocket) => {
    let response = req;
    try {
        const pool = await getConnectionEmpresa(response.EMPRESA, response.ACCION);
        const result = pool.request()
            .input("ACCION", Mssql.VarChar(50), 'MENSAJE LEIDO')
            .input("DATA_JSON", Mssql.VarChar, JSON.stringify(response.data))
            .execute("spMensajeria").then(function (recordSet: any) {
                let refresh = undefined;
                if (process.env.NEWTOKEN != '')
                    refresh = process.env.NEWTOKEN;

                ws.send(JSON.stringify({
                    topic: 'change_status_mensaje', data: recordSet.recordset[0]["DATOS"]
                }));
            })
            .catch((err: any) => {
                console.warn(err);
            })

    } catch (err) {
    }
};

export const getAplicacion = async (req: any, res: any) => {
    const empresaDato = req.body.prmConexion;
    try {
        const pool = await getConnectionEmpresa(empresaDato.EMPRESA, req.body.prmAccion);
        const result = pool.request()
            .input("ACCION", Mssql.VarChar(50), req.body.prmAccion)
            .input("DATA_JSON", Mssql.VarChar, req.body.prmDatos)
            .execute("spMensajeria").then(function (recordSet: any) {
                let refresh = undefined;
                if (process.env.NEWTOKEN != '')
                    refresh = process.env.NEWTOKEN;
                res.json({
                    data: recordSet.recordset[0]["DATOS"],
                    token: refresh,
                });
            })
            .catch((err: any) => {
                console.warn(err);
                res.json(JSON.stringify([{ ErrMensaje: err.originalError.info.message }]));
            })

    } catch (err) {
        res.status(400).json({ message: err })
    }
};