import { useState, useRef } from 'react';

const QUICK = [
  'What is DNA replication?', 'Explain photosynthesis',
  'How do cells divide?', 'What is natural selection?', 'Explain enzyme action',
];

export default function BottomBar({ input, setInput, onSend, onQuickQuestion, disabled }) {
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!disabled && input.trim()) onSend(); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/ocr', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('OCR failed');
      const data = await response.json();
      const extracted = data.text?.trim() || '';
      setInput(prev => (prev ? prev + '\n' : '') + extracted);
    } catch (err) {
      alert('Failed to extract text from image. Try a clearer photo!');
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bottom-bar">
      <div className="quick-questions">
        <span className="quick-label">Try:</span>
        {QUICK.map(q => (
          <button key={q} className="quick-btn" onClick={() => onQuickQuestion(q)} disabled={disabled || ocrLoading}>{q}</button>
        ))}
      </div>
      <div className="input-row">
        <div className="input-wrap">
          <button className="upload-btn" title={ocrLoading ? 'Scanning…' : 'Scan image (OCR)'}
            onClick={() => fileInputRef.current?.click()} disabled={disabled || ocrLoading}>
            {ocrLoading
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
            }
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} style={{display:'none'}} onChange={handleImageUpload} />
          <div className="input-divider" />
          <input className="input-field" type="text"
            placeholder={ocrLoading ? 'Scanning image…' : 'Ask anything about biology…'}
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown} disabled={disabled || ocrLoading} autoComplete="off" />
        </div>
        <button className="send-btn" onClick={onSend} disabled={disabled || ocrLoading || !input.trim()} aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/></svg>
        </button>
      </div>
    </div>
  );
}
