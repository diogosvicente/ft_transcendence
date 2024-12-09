import { Route, Routes } from 'react-router-dom';
import { JoinChatForm } from './domain/chat/components/JoinChatForm.jsx';
import Chat from './domain/chat/containers/Chat.jsx'

function App() {
  return (
    <Routes>
      <Route path='/' element={<JoinChatForm />} />
      <Route path='chat/:roomName' element={<Chat />} />
    </Routes>
  );
}

export default App
