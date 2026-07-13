import { Route } from 'react-router-dom/cjs/react-router-dom.min';
import './App.css';
import { Button, HStack } from "@chakra-ui/react";
import HomePage from './Pages/HomePage';
import ChatPage from './Pages/ChatPage';
import ProfilePage from './Pages/ProfilePage';
import ConnectionsPage from './Pages/ConnectionsPage';
import "./App.css"

function App() {
  return (
    <div className="App">
      <Route path="/" component={HomePage} exact />
      <Route path="/chats" component={ChatPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/connections" component={ConnectionsPage} />
    </div>
  );
}

export default App;
