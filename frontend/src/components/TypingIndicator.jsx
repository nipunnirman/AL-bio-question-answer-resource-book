export default function TypingIndicator() {
  return (
    <div className="message-row bot">
      <div className="avatar">🌿</div>
      <div className="message-content">
        <div className="bot-label"><span className="bot-label-dot" />BioBot</div>
        <div className="bubble bot">
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}
