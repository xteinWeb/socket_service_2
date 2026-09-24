import handleHttpError from '../utils/handleError';
import { verifyToken, refreshToken } from '../utils/handleJwt';

const authMiddleware = async (req:any, res:any, next:any) => {
  try {
    const token = req.body.prmTokenDatos.TOKEN;
    let newToken;
    
    if (!token) {
      handleHttpError(res, 'TOKEN NO ENCONTRADO', 401);
      return;
    }
    
    let verifiToken:any = verifyToken(token);

    // console.log('----------------------------------');
    // console.log('verifiToken.exp: '+verifiToken.exp);
    // console.log('----------------------------------');

    let current_time = new Date().getTime() / 1000;
    // console.log('----------------------------------');
    // console.log('current_time: '+current_time);
    // console.log('----------------------------------');
    if ( (current_time >= verifiToken.exp) || (verifiToken.exp === undefined) ) {
      newToken = refreshToken(req.body.prmTokenDatos);
      process.env.NEWTOKEN = newToken;
      verifiToken = verifyToken(newToken);
    }

    if ( !verifiToken ) {
      handleHttpError(res, 'TOKEN NO VALIDO', 401);
      return;
    }

    next();    
  } catch (error) {
    console.log(error);
    handleHttpError(res, 'ERROR DE AUTENTICACIÓN EN MIDDLEWARE', 500);
  }
}

export default authMiddleware;