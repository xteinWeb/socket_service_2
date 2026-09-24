import * as recordatorio from "../email/recordatorio.controller";
import moment from "moment-timezone";

// import { io } from "../../app";

let userIntervals: any = {};
let previousData: any = {};
const startRecordatorioInterval = (data: any, ws: WebSocket) => {
  let userId = data.user;

  if (userIntervals[userId]) {
    clearInterval(userIntervals[userId]);
  }

  userIntervals[userId] = setInterval(() => {
    recordatorio.consultarRecordatorios(userId)
      // .then(recordatoriosUserData => {
      //   if (recordatoriosUserData && recordatoriosUserData.length > 0) {

      //     let currentData = JSON.parse(recordatoriosUserData);

      //     for (let i = 0; i < currentData.length; i++) {
      //       const element = currentData[i];

      //       if (element.ErrMensaje !== undefined && element.ErrMensaje !== null && element.ErrMensaje !== '') {
      //         console.error('ErrMensaje', element.ErrMensaje);
      //         return;
      //       } else {
      //         const fechasis = new Date();
      //         let FECHA_SIS = formatDate(fechasis, 'YYYY-MM-DD', 'America/Bogota');
      //         let FECHA_FINAL = formatDate(element.FECHA_FIN, 'YYYY-MM-DD', 'America/Bogota');
      //         if (FECHA_SIS <= FECHA_FINAL) {
      //           if (element.FECHA_ENVIO === null || element.FECHA_ENVIO === undefined || element.FECHA_ENVIO === '') {
      //             if (previousData[userId] !== undefined) {
      //               if (previousData[userId][i] === element) {
      //                 console.warn('Los datos no han cambiado, no emitimos.');
      //                 return;
      //               }
      //             }

      //             changeDateRecordatorio('1', element)
      //             ws.send(JSON.stringify({ topic: 'response_recodatorio', data: element }));

      //             previousData[userId] = JSON.parse(recordatoriosUserData);
      //           } else if (element.FECHA_ENVIO !== null || element.FECHA_ENVIO !== undefined || element.FECHA_ENVIO !== '' && (element.TIPO_RECORDATORIO === 'TODO_DIA_R')) {

      //             let FECHA_ENVIO = formatDate(element.FECHA_ENVIO, 'YYYY-MM-DD', 'America/Bogota');
      //             if (FECHA_ENVIO < FECHA_FINAL) {
      //               if (previousData[userId] !== undefined) {
      //                 if (previousData[userId][i] === element) {
      //                   console.warn('Los datos no han cambiado, no emitimos.');
      //                   return;
      //                 }
      //               }
      //               changeDateRecordatorio('2', element)
      //               ws.send(JSON.stringify({ topic: 'response_recodatorio', data: element }));
      //             }
      //           }
      //         }
      //       }
      //     }
      //   }
      // })
      .catch(err => {
        console.error('Error al obtener los recordatorios:', err.message);
      });
  }, 15000); // 30 segundos
};

export const getRecordatorio = async (data: any, accion: any, ws: any) => {
  let userId = data.user;
  switch (accion) {
    case 'get_data_recodatorio':
      startRecordatorioInterval(data, ws);
      break;

    case 'userDisconnect':


      if (userIntervals[userId]) {
        if (data.id && userIntervals[data.id]) {
          clearInterval(userIntervals[userId]);
          console.warn('Intervalo detenido para el usuario:', userId);
          delete userIntervals[userId];
          delete previousData[userId]; // Limpiar los datos previos también
          console.warn('Intervalo y datos previos eliminados para el usuario:', userId);
        }
      } else {
        console.warn('No se encontró intervalo para el usuario:', userId);
      }
      break;

    default:
      break;
  }

  return;
};


export const changeDateRecordatorio = (number: string, data: any) => {
  // Ejemplo de uso:
  const now = new Date();
  const formattedDate = formatDate(now, 'YYYY-MM-DD HH:mm:ss', 'America/Bogota');
  data.FECHA_ENVIO = formattedDate
  recordatorio.setShippingDateREC(data)
}

const formatDate = (date: Date, format: string, timezone = 'UTC') => {
  return moment(date).tz(timezone).format(format);
};