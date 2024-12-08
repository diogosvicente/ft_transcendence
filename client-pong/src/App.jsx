import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react"

function JoinChatRoomForm() {
  const inputRef = useRef(null);
  const submitButtonRef = useRef(null);

  const [inputText, setInputText] = useState("");

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  // Submit form when Enter key is pressed
  function handleKeyUp(e) {
    if (e.key === "Enter") {
      submitButtonRef.current.click();
    }
  }

  return (
    <div>
      <label htmlFor="room-name-input">What chat room would you like to enter?</label><br />
      <input
        type="text"
        id="room-name-input"
        size="100"
        value={inputText}
        ref={inputRef}
        onChange={(e) => setInputText(e.target.value)}
        onKeyUp={(e) => handleKeyUp(e)} /><br />
      <input
        type="button"
        id="room-name-submit"
        value="Enter"
        ref={submitButtonRef} />
    </div>
  );
}

function App() {

  return (
    <>
      <JoinChatRoomForm />
    </>
  )
}

export default App
