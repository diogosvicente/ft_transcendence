import { useRef } from "react";

export function ChatMessageInput({ onChatSendButtonClick, onMessageChange, message }) {
  const chatSendButtonRef = useRef(null);

  // Manually triggers click event for send button
  // when Enter key is pressed
  const handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      chatSendButtonRef.current.click();
    }
  }

  return (
    <>
      <input
        type="text"
        value={message} placeholder="Send a message"
        onChange={(e) => onMessageChange(e.target.value)}
        size="100"
        onKeyUp={handleKeyUp}
      />
      <br />
      <input
        type="button"
        value="Send"
        onClick={onChatSendButtonClick}
        ref={chatSendButtonRef}
      />
    </>
  );
}
