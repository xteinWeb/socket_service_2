import { getConnectionEmpresa, Mssql } from "../../database/connectionEmpresa";
import * as nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import request from 'request';
import { google } from 'googleapis';
import { topicActions } from "../../service/webSocket/ITwebSocket";


let especAplicacion: any = [];
export const parameterSendEmail = async (datos: any, ws?: any) => {
    console.log('---EVENTO RECIBIDO--- ', datos);
    const empresaDato = JSON.parse(datos.ACTIVIDAD).EMPRESA;
    let prmDatosActividad = JSON.parse(datos.ACTIVIDAD);
    let prmDatos = {
        ...datos,
        USUARIO_ENV: datos.USUARIO_ENV.ID_RESPONSABLE,
        USUARIO_REC: datos.USUARIO_REC.ID_RESPONSABLE,
        APLICACION: datos.APLICACION,
    };

    try {
        const pool = await getConnectionEmpresa(empresaDato, 'PARAMETROS EMAIL');
        const recordSet = await pool.request()
            .input("ACCION", Mssql.VarChar(50), 'PARAMETROS EMAIL')
            .input("DATA_JSON", Mssql.VarChar, JSON.stringify(prmDatos))
            .execute("spMensajeria")

        if (recordSet.recordset && recordSet.recordset[0]) {
            let resp = JSON.parse(recordSet.recordset[0]["DATOS"]);
            // ws.send(JSON.stringify({ topic: 'SUCCES_EMAIL', data: `${recordSet.recordset[0]["DATOS"]}` }));
            especAplicacion = resp[0].ESPEC;
            formatDataEmail(prmDatos, resp, ws);
        }

    } catch (err) {
        throw ws.send(JSON.stringify({ topic: 'ERRROR', data: `Error getting access token:: ${err}` }));
    }
};


export function formatDataEmail(datos: any, email: any, ws: WebSocket) {

    let prmDatosActividad = JSON.parse(datos.ACTIVIDAD);

    const prm = datos;
    // Convertir la cadena ISO a un objeto Date
    let fechaHoraISO = prm.FECHA_UPDATE;
    let fechaHora = new Date(fechaHoraISO);
    // Obtener los componentes de la fecha
    let año = fechaHora.getFullYear();
    let mes = String(fechaHora.getMonth() + 1).padStart(2, '0'); // Los meses comienzan desde 0
    let dia = String(fechaHora.getDate()).padStart(2, '0');
    // Obtener los componentes de la hora
    let horas = String(fechaHora.getHours()).padStart(2, '0');
    let minutos = String(fechaHora.getMinutes()).padStart(2, '0');
    let segundos = String(fechaHora.getSeconds()).padStart(2, '0');
    // Formatear la fecha y la hora
    let fechaFormateada = `${año}-${mes}-${dia} - ${horas}:${minutos}:${segundos}`;

    // Prepara y confirma envio de correo

    let asunto = especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'ASUNTO EMAIL')?.VALOR_DEFECTO ?? '';
    let email_sale = especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'EMAIL SALIENTE')?.VALOR_DEFECTO ?? '';
    let replacements = {};
    switch (prm.APLICACION) {
        case 'GES-001':
            asunto = asunto.replace('%ACCION%', prmDatosActividad.ACCION);
            asunto = asunto.replace('%NOMBRE_APLICACION%', email[0].APLICACION[0].NOMBRE);
            if (email[0].USUARIO_REC[0] !== undefined) {
                replacements = {
                    ACCION: prmDatosActividad.ACCION,
                    USUARIO_ENV: email[0].USUARIO_ENV[0].NOMBRE,
                    NOMBRE_USUARIO: email[0].USUARIO_REC[0].length > 0 ? email[0].USUARIO_REC[0].NOMBRE : '',
                    FECHA_UPDATE: fechaFormateada,
                    NOMBRE_APLICACION: email[0].APLICACION[0].NOMBRE,
                    TITULO: prm.DESCRIPCION,
                    DESCRIPCION: prmDatosActividad.TIMELINE
                }
            }
            break;

        case 'COM-203':
        case 'COM-204':
        case 'COM-205':
        case 'COM-206':
            asunto = asunto.replace('%TIPO_MOVIMIENTO%', prm.DATOS.TIPO);
            asunto = asunto.replace('%DOCUMENTO%', datos.DATOS.DOCUMENTO);
            if (email[0].USUARIO_REC[0] !== undefined) {
                replacements = {
                    USUARIO_ENV: email[0].USUARIO_ENV[0].NOMBRE,
                    NOMBRE_USUARIO: email[0].USUARIO_REC[0].length > 0 ? email[0].USUARIO_REC[0].NOMBRE : '',
                    FECHA_UPDATE: fechaFormateada,
                    NOMBRE_APLICACION: email[0].APLICACION[0].NOMBRE,
                    TIPO_MOVIMIENTO: prm.DATOS.TIPO,
                    DOCUMENTO: prm.DATOS.DOCUMENTO,
                    TITULO: prm.TITULO,
                    DESCRIPCION: prm.DESCRIPCION
                }
            }
            break;

        default:
            break;
    }

    if (email[0].USUARIO_REC[0] !== undefined) {

        const dataSource = {
            ORIGEN_EMAIL: email_sale,
            DESTINO: email[0].USUARIO_REC[0].length > 0 ? email[0].USUARIO_REC[0].USUARIO + ' - ' + email[0].USUARIO_REC[0].NOMBRE : '' + ' - ' + '',
            DESTINO_EMAIL: email[0].USUARIO_REC[0].EMAIL ? email[0].USUARIO_REC[0].EMAIL : '',
            ASUNTO: asunto,
            REMPLAZAR: replacements
        }
        onRespuestaEnvioCorreo(dataSource, email, ws);
    }
}

// Respuesta accion del correo
export function onRespuestaEnvioCorreo(datos: any, email: any, ws: WebSocket) {
    let template = especAplicacion.find((e: any) => e.NOMBRE_OBJETO === 'TEMPLATE')?.VALOR_DEFECTO ?? '';

    const prmJ = {
        "prmDatos": JSON.stringify({
            "datos": {
                usuario: email[0].USUARIO_ENV[0].USUARIO,
                prm_email: datos,
                template,
                replacements: datos.REMPLAZAR
            }
        })
    }
    sendMail({ body: prmJ }, ws);
}


    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, "https://developers.google.com/oauthplayground");
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    try {
        const accessToken = await oauth2Client.getAccessToken();
        return { clientId, clientSecret, refreshToken, accessToken: accessToken.token };
    } catch (error) {
        console.error('Error getting access token:', error);
        throw ws.send(JSON.stringify({ topic: 'ERRROR', data: `Error getting access token:: ${error}` }));
        ;
    }
}


export const sendMail = async (req: any, ws: any, res_accion?: any) => {
    let prmEmail
    switch (res_accion) {
        case "get_data_email":
            prmEmail = req;

            break;

        default:
            prmEmail = JSON.parse(req.body.prmDatos);
            break;
    }
    try {
        const emailDomain = prmEmail.datos.prm_email.ORIGEN_EMAIL.match(/@([\w-]+)\./)[1];
        const { clientId, clientSecret, refreshToken, accessToken } = await createOAuth2Client(emailDomain, ws);
        if (!accessToken) {
            throw new Error('No access token received');
        }
        // Obtener el template utilizando request

        request.get(`http://192.168.11.153:9301/email/templates/${prmEmail.datos.template}`, function (error: any, response: any, body: any) {
            if (error || response.statusCode !== 200) {

                console.error('Error al obtener el template:', error || response.statusMessage);
                return ws.send(JSON.stringify({ topic: 'ERRROR', data: `Error al obtener el template: ${error || response.statusMessage}` }));
            }

            const templateSource = body;
            let htmlToSend;

            if (templateSource) {
                const template = handlebars.compile(templateSource);
                htmlToSend = template(prmEmail.datos.replacements);
            } else {
                htmlToSend = "<p>" + prmEmail.datos.prm_email.ASUNTO + "</p>";
            }

            console.log("Este es el email: " + prmEmail.datos.prm_email.ORIGEN_EMAIL)

            const smtpTransport = nodemailer.createTransport({
                service: 'gmail',  // Si usas Gmail como servicio de correo
                auth: {
                    type: "OAuth2",
                    user: prmEmail.datos.prm_email.ORIGEN_EMAIL, // El email del remitente
                    clientId: clientId,  // Tu clientId
                    clientSecret: clientSecret,  // Tu clientSecret
                    refreshToken: refreshToken,  // El refreshToken
                    accessToken: accessToken,  // El accessToken
                },
                tls: {
                    rejectUnauthorized: false,  // Si no quieres que el correo sea rechazado en caso de errores de certificados
                },
            });

            console.warn('from: ' + prmEmail.datos.prm_email.ORIGEN_EMAIL)
            console.warn('to: ' + prmEmail.datos.prm_email.DESTINO_EMAIL)
            console.warn('subject: ' + prmEmail.datos.prm_email.ASUNTO)
            const mailOptions = {
                from: prmEmail.datos.prm_email.ORIGEN_EMAIL,
                to: prmEmail.datos.prm_email.DESTINO_EMAIL,
                subject: prmEmail.datos.prm_email.ASUNTO,
                text: 'Correo enviado!',
                html: htmlToSend,
                attachments: prmEmail.datos.archivo ? [{
                    filename: prmEmail.datos.archivo,
                    path: `http://192.168.11.153:9301/email/envios/${prmEmail.datos.archivo}`,
                    contentType: 'application/pdf',
                }] : [],
            };
            smtpTransport.sendMail(mailOptions, (error, response) => {
                if (error !== null) {
                    console.warn('error4---------', error);
                    ws.send(JSON.stringify({ topic: 'ERRROR', data: `Error enviando el correo: ${error}` }));
                } else {
                    smtpTransport.close();

                    ws.send(JSON.stringify({ topic: 'SUCCES_EMAIL', data: `Correo Enviado: ${response}` }));
                }
            });
        }).on('error', function (error: any) {
            return ws.send(JSON.stringify({ topic: 'ERRROR', data: `Error al obtener el template de correo: ${error}` }));
        });

    } catch (error: any) {
        ws.send(JSON.stringify({ topic: 'ERRROR', data: `Error al obtener el template de correo: ${error.message}` }));
    }
};
