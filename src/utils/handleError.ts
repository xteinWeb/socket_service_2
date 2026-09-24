const handleHttpError = (res:any, error:any = 'HTTP_INTERNAL_SERVER_ERROR', code = 500) => {
    res.status(code);
    res.send({ errors: error.errors || error.message || error });
}

export default handleHttpError;