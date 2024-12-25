import { useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom';

export function JoinChatRoomForm() {
  const [inputText, setInputText] = useState('');

  let navigate = useNavigate();

  const submitButtonRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  // Manually triggers click event from "Submit" button on pressing Enter key
  const handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      submitButtonRef.current.click();
    }
  }

  const handleSubmit = () => {
    const roomName = inputText;
    navigate(`/chat/${roomName}`);
  };

  return (
    <div>
      <label htmlFor="room-name-input">What chat room would you like to enter?</label><br />
      <input
        type="text"
        size="100"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyUp={(e) => handleKeyUp(e)}
        ref={inputRef}
      />
      <br />
      <input
        type="button"
        value="Enter"
        ref={submitButtonRef}
        onClick={handleSubmit}
      />
    </div>
  );
}
