import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message }) {
  const { role, text, citations, error, time } = message;
  const isBot = role === 'bot';
  return (
    <div className={`message-row ${role}`}>
      {isBot && <div className="avatar">🌿</div>}
      <div className="message-content">
        {isBot && (
          <div className="bot-label"><span className="bot-label-pip" /> BioBot</div>
        )}
        <div className={`bubble ${role}${error ? ' error-bubble' : ''}`}>
          {isBot ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
            }}>{text}</ReactMarkdown>
          ) : (
            text.split('\n').map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)
          )}
        </div>
        {citations && Object.keys(citations).length > 0 && (
          <div className="citations">
            {Object.entries(citations).map(([id, meta]) => (
              <span key={id} className="citation-tag" title={`Page ${meta.page} — ${meta.source}`}>[{id}] p.{meta.page}</span>
            ))}
          </div>
        )}
        <div className="msg-time">{formatTime(time)}</div>
      </div>
    </div>
  );
}
