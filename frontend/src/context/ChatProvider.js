import { createContext, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

// make a context for chat application using createContext
const ChatContext = createContext();

// now make a provider component which will wrap the application and provide the context to all components
// here we will define the state and functions that will be shared across the application
// and here children prop is signifying the app components that will be wrapped by this provider
const ChatProvider = ({ children }) => {

    // now if we make any state, initially it was only accessible to this component only but now since im making it in the provider
    // it will be accessible to all the components wrapped inside this provider using useContext hook
    const [user, setUser] = useState(); // state to store the logged in user info
    const [selectedChat, setSelectedChat] = useState();
    const [chats,setChats] = useState([]);
    // global state for notifications
    const [notification, setNotification] = useState([]);


    const history = useHistory();

    // fetching user info from local storage when the component mounts and user logs in
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        setUser(userInfo);

        // if user is not logged in redirect to login page
        // if (!userInfo) {
        //     history.push("/");
        // }
    }, [history]);

    return (
        // now in the value prop of provider we will pass the states and functions that we want to share
        <ChatContext.Provider value={{ user, setUser, selectedChat, setSelectedChat, chats, setChats, notification, setNotification }}>
            {children}
        </ChatContext.Provider>
    )
}

// custom hook to use the chat context
export const ChatState = () => {
    // to make our states accessible to other components we will use useContext hook
    return useContext(ChatContext);
}

export default ChatProvider;