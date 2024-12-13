import { Route, Routes } from 'react-router-dom';

import { JoinChatRoomForm } from './domain/chat/components/JoinChatRoomForm.jsx';
import Chat from './domain/chat/containers/Chat.jsx'

function App() {
  return (
    <Routes>
      <Route path='/chat' element={<JoinChatRoomForm />} />
      <Route path='chat/:roomName' element={<Chat />} />
    </Routes>
  );
}

export default App
