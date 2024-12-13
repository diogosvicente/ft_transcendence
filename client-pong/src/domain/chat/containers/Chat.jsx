import { useParams } from 'react-router-dom';
import { ChatLog } from '../components/ChatLog.jsx'
import { ChatMessageInput } from '../components/ChatMessageInput.jsx'
import { useEffect, useRef, useState } from 'react';

/* TODO: Scroll the chat log to the last message */
/* TODO: Add more socket event handlers */

export default function Chat() {
  const { roomName } = useParams();

  const [message, setMessage] = useState('');
  const [chatLogMessages, setChatLogMessages] = useState([]);

  const chatSocketRef = useRef(null);

  const WS_SERVER_HOST = 'localhost:8000';
  const socketUrl = `ws://${WS_SERVER_HOST}/ws/chat/${roomName}/`;

  // Start WS server connection on component mounting
  useEffect(() => {
    if (chatSocketRef.current) { return; } // Prevent react's strict mode re-render

    const socket = new WebSocket(socketUrl);

    socket.onmessage = function(e) {
      const data = JSON.parse(e.data);
      setChatLogMessages(prevLog => [...prevLog, data.message]);
    };

    chatSocketRef.current = socket;
  }, []);

  const handleChatSendButtonClick = () => {
    chatSocketRef.current.send(JSON.stringify({
      'message': message
    }));
    setMessage('');
  };

  return (
    <>
      <ChatLog messages={chatLogMessages} /><br />
      <ChatMessageInput
        onChatSendButtonClick={handleChatSendButtonClick}
        onMessageChange={setMessage}
        message={message}
      />
    </>
  );
}
