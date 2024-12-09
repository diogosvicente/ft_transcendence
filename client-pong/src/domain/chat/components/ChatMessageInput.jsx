export function ChatMessageInput() {
  return (
    <>
      <input
        type="text"
        id="chat-message-input"
        placeholder="Send a message"
        size="100"
      />
      <br />
      <input
        id="chat-message-submit"
        type="button"
        value="Send"
      />
    </>
  );
}
