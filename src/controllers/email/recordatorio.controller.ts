import { getConnectionEmpresa, Mssql } from "../../database/connectionEmpresa";

export const consultarRecordatorios = async (user: any) => {
  const empresaDato = "00";
  let prmDatos = { ID_RESPONSABLE: user };
  let recordatoriosUser = [];

  try {

    // const pool = await getConnectionEmpresa(empresaDato, 'ACTIVIDADES RECORDATORIO');
    // console.log('socket pool recordatorio '+ pool);
    // // --- VALIDACIÓN AÑADIDA ---
    // if (!pool) {
    //   console.error("Error: No se pudo establecer conexión con la base de datos (pool is undefined).");
    //   return []; // Retornamos un arreglo vacío para que el resto de la app no falle
    // }
    // // ---------------------------

    // const recordSet = await pool.request()
    //   .input("ACCION", Mssql.VarChar(50), 'ACTIVIDADES RECORDATORIO')
    //   .input("DATA_JSON", Mssql.VarChar, JSON.stringify(prmDatos))
    //   .execute("spActividades");

    // if (recordSet.recordset && recordSet.recordset[0]) {
    //   let resp = recordSet.recordset[0]['DATOS'];

    //   recordatoriosUser = resp;
    // }
    // return recordatoriosUser;
    return [];
  } catch (err: any) {
    // Manejo de errores
    console.warn(err);
    return [];
  }
};

export const setShippingDateREC = async (data: any) => {
  const empresaDato = "00";
  let prmDatos = { ID_ACTIVIDAD: data.ID_ACTIVIDAD, FECHA_ENVIO: data.FECHA_ENVIO };

  try {

    // const pool = await getConnectionEmpresa(empresaDato, 'ACTUALIZAR FECHA ENVIO');

    // const recordSet = await pool.request()
    //   .input("ACCION", Mssql.VarChar(50), 'ACTUALIZAR FECHA ENVIO')
    //   .input("DATA_JSON", Mssql.VarChar, JSON.stringify(prmDatos))
    //   .execute("spActividades");

    // if (recordSet.recordset && recordSet.recordset[0]) {
    //   let resp = recordSet.recordset[0]['DATOS'];
    //   console.warn(resp);
    // }
    return [];
  } catch (err: any) {
    // Manejo de errores
    console.warn(err);
  }
};
