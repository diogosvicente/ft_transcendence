import { useParams } from 'react-router-dom';
import { ChatLog } from '../components/ChatLog.jsx'
import { ChatMessageInput } from '../components/ChatMessageInput.jsx'
import { useEffect } from 'react';

export default function Chat() {
  const { roomName } = useParams();

  const WS_SERVER_HOST = 'localhost:8000';
  const socketUrl = `ws://${WS_SERVER_HOST}/ws/chat/${roomName}/`;

  useEffect(() => {
    const chatSocket = new WebSocket(socketUrl);

    chatSocket.onopen = () => {
      console.log('CONNECTION ESTABLISHED');
    };

  }, []);

  return (
    <>
      <h2>Chat Room: {roomName}</h2>
      <ChatLog /><br />
      <ChatMessageInput />
    </>
  );
}
