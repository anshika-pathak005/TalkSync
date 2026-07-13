import Connection from "../Modals/connectionModel.js";

// finds the connection row between 2 users regardless of who is sender/receiver
export const getConnectionBetween = async (userA, userB) => {
    return await Connection.findOne({
        $or: [
            { sender: userA, receiver: userB },
            { sender: userB, receiver: userA },
        ],
    });
};