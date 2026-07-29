let ioInstance = null;

export const setIO = (io) => {
    ioInstance = io;
};

export const getIO = () => {
    if (!ioInstance) {
        console.log("Warning: getIO() called before socket server was initialized");
    }
    return ioInstance;
};