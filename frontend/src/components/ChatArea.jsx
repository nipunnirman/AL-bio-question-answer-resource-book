import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function ChatArea({ messages, loading, chatEndRef }) {
  return (
    <div className="chat-area" id="chat-area">
      {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
      {loading && <TypingIndicator />}
      <div ref={chatEndRef} />
    </div>
  );
}
