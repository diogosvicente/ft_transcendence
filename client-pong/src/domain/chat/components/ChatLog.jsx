export function ChatLog({ messages }) {
  return (
    <textarea
      value={messages.join('\n')}
      readOnly
      cols="100"
      rows="20"
    >
    </textarea>
  );
}
