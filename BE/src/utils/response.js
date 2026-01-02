
export const sendResponse = (res, status, message, data = null) => {
    const response = { message };
    if (data !== null) {
        Object.assign(response, data);
    }
    return res.status(status).json(response);
};

export const throwHttpError = (status, message) => {
    const err = new Error(message);
    err.status = status;
    throw err;
};