import { useParams } from "react-router-dom";
import { ChatLog } from "../components/ChatLog.jsx";
import { ChatMessageInput } from "../components/ChatMessageInput.jsx";
import { useEffect, useRef, useState } from "react";
import Navbar from "../../template/Navbar";

/* TODO: Scroll the chat log to the last message */
/* TODO: Add more socket event handlers */

export default function Chat() {
  const { roomName } = useParams();

  const [message, setMessage] = useState("");
  const [chatLogMessages, setChatLogMessages] = useState([]);

  const chatSocketRef = useRef(null);

  // Start WS server connection on component mounting
  useEffect(() => {
    if (chatSocketRef.current) {
      return;
    } // Prevent react's strict mode re-render

    const socketUrlDev = `ws://localhost:8000/ws/chat/${roomName}/`;
    const socket = new WebSocket(socketUrlDev);

    socket.onmessage = function (e) {
      const data = JSON.parse(e.data);
      setChatLogMessages((prevLog) => [...prevLog, data.message]);
    };

    chatSocketRef.current = socket;
  }, [roomName]);

  const handleChatSendButtonClick = () => {
    chatSocketRef.current.send(
      JSON.stringify({
        message: message,
      })
    );
    setMessage("");
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h1>Chat Room: {roomName}</h1>
        <ChatLog messages={chatLogMessages} />
        <br />
        <ChatMessageInput
          onChatSendButtonClick={handleChatSendButtonClick}
          onMessageChange={setMessage}
          message={message}
        />
      </div>
    </>
  );
}
