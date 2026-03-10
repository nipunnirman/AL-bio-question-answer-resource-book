const QUICK = [
  'What is DNA replication?',
  'Explain photosynthesis',
  'How do cells divide?',
  'What is natural selection?',
  'Explain enzyme action',
];

export default function BottomBar({ input, setInput, onSend, onQuickQuestion, disabled }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
  };
  return (
    <div className="bottom-bar">
      <div className="quick-questions">
        <span className="quick-label">Explore:</span>
        {QUICK.map(q => (
          <button key={q} className="quick-btn" onClick={() => onQuickQuestion(q)} disabled={disabled}>{q}</button>
        ))}
      </div>
      <div className="input-row">
        <div className="input-wrap">
          <input
            className="input-field" type="text"
            placeholder="Ask anything about biology…"
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown} disabled={disabled} autoComplete="off"
          />
        </div>
        <button className="send-btn" onClick={onSend} disabled={disabled || !input.trim()} aria-label="Send">
          ↑
        </button>
      </div>
    </div>
  );
}
