import { useParams } from 'react-router-dom';
import { ChatLog } from '../components/ChatLog.jsx'
import { ChatMessageInput } from '../components/ChatMessageInput.jsx'

export default function Chat() {
  const { roomName } = useParams();

  return (
    <>
      <h2>Chat Room: {roomName}</h2>
      <ChatLog /><br />
      <ChatMessageInput />
    </>
  );
}
