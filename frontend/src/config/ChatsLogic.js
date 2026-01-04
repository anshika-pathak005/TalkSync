
// here just check jo user logged in hai wo sender nhi hoga to doosre user ka namee bhej denge thats it
// export const getSender = (loggedUser, users)=>{
//     return users[0]._id === loggedUser._id ? users[1].name : users[0].name;
// }

export const getSender = (loggedUser, users) => {
    if (!users || users.length < 2) return "";

    return users[0]._id === loggedUser._id
        ? users[1].name
        : users[0].name;
};

export const getSenderFullData = (loggedUser, users) =>{
    if (!users || users.length < 2) return "";

    return users[0]._id === loggedUser._id
        ? users[1]
        : users[0];
}


// this logic is for that we waana show the profile pic of the other user , that is sender, and that pic will not be shown on the reciever that is currently logged in user, and that pic should only come to the last of message of that sender
export const isSameSender = (messages, m, i, userId) => {
    return (
        i < messages.length - 1 &&
        (messages[i + 1].sender._id !== m.sender._id ||
            messages[i + 1].sender._id === undefined) &&
        messages[i].sender._id !== userId
    );
};


// in this one we are checking if this particular message is last message or not,
export const isLastMessage = (messages, i, userId) => {
    return (
        i === messages.length - 1 &&
        messages[messages.length - 1].sender._id !== userId &&
        messages[messages.length - 1].sender._id
    );
};

// these 2 logic was useful for displaying the avatar of the sender


// to align our messages at the left and other users at the right
export const isSameSenderMargin = (messages, m, i, userId) => {
    // console.log(i === messages.length - 1);

    if (
        i < messages.length - 1 &&
        messages[i + 1].sender._id === m.sender._id &&
        messages[i].sender._id !== userId
    )
        return 33;
    else if (
        (i < messages.length - 1 &&
            messages[i + 1].sender._id !== m.sender._id &&
            messages[i].sender._id !== userId) ||
        (i === messages.length - 1 && messages[i].sender._id !== userId)
    )
        return 0;
    else return "auto";
};

// to have marginbetween messag of sender and the user
export const isSameUser = (messages, m, i) => {
    return i > 0 && messages[i - 1].sender._id === m.sender._id;
};