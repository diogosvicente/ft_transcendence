import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../template/Navbar";

export function JoinChatRoomForm() {
  const [inputText, setInputText] = useState("");

  const navigate = useNavigate();

  const submitButtonRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  // Manually triggers click event from "Submit" button on pressing Enter key
  const handleKeyUp = (e) => {
    if (e.key === "Enter") {
      submitButtonRef.current.click();
    }
  };

  const handleSubmit = () => {
    const roomName = inputText.trim();
    if (roomName) {
      navigate(`/chat/${roomName}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h1>Join a Chat Room</h1>
        <label htmlFor="room-name-input">
          What chat room would you like to enter?
        </label>
        <br />
        <input
          type="text"
          size="100"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyUp={(e) => handleKeyUp(e)}
          ref={inputRef}
          className="form-control mt-3"
        />
        <br />
        <input
          type="button"
          value="Enter"
          ref={submitButtonRef}
          onClick={handleSubmit}
          className="btn btn-primary mt-3"
        />
      </div>
    </>
  );
}
