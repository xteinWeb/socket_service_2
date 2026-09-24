import jwt from 'jsonwebtoken';

const JWT_KEY = process.env.key;
const JWT_REFRESH_KEY = process.env.refreshKey;

var JWT_REFRESH_KEYS: any[] = [];

const tokenSign = (user:any) => {
  const data = JSON.parse(user);
  const payLoad = {
    username: data["USUARIO"],
    business: data["EMPRESA"],
    check: true
  };
  const token = jwt.sign(payLoad, JWT_KEY!,
    {
      expiresIn: '2h',
    }
  );
  return token;
};

const verifyToken = (tokenJwt:any) => {
  try {
    // console.log('----------------------------------');
    // console.log('VERIFICANDO TOKEN');
    // console.log('----------------------------------');
    if (JWT_REFRESH_KEYS.length != 0) {
      if (JWT_REFRESH_KEYS.findIndex((e:any) => e.newToken === tokenJwt) === -1) {
        // console.log('----------------------------------');
        // console.log('VERIFICANDO TOKEN DE SESSION');
        // console.log('----------------------------------');
        return jwt.verify(tokenJwt, JWT_KEY!);
      } else {
        // console.log('----------------------------------');
        // console.log('VERIFICANDO REFRESH TOKEN');
        // console.log('----------------------------------');
        return jwt.verify(tokenJwt, JWT_REFRESH_KEY!);
      }

    } else {
      return jwt.verify(tokenJwt, JWT_KEY!);
    }

  } catch (error) {
    return false;
  }
};


const refreshToken = (dataToken:any) => {

  // console.log('----------------------------------');
  // console.log('GENERANDO NUEVO TOKEN');
  // console.log('----------------------------------');
  const data = dataToken;
  const payLoad = {
    username: data["USUARIO"],
    business: data["EMPRESA"],
    check: true
  };
  const newToken = jwt.sign(payLoad, JWT_REFRESH_KEY!,
    {
      expiresIn: '1h',
    }
  );

  JWT_REFRESH_KEYS.push({ newToken: newToken });

  // console.log('----------------------------------');
  // console.log('NUEVO TOKEN: '+newToken);
  // console.log('----------------------------------');
  return newToken;
};

export { tokenSign, verifyToken, refreshToken };