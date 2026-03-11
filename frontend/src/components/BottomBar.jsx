import { useState, useRef } from 'react';

const QUICK = [
    'What is DNA replication?',
    'Explain photosynthesis',
    'How do cells divide?',
    'What is natural selection?',
    'Explain enzyme action',
];

export default function BottomBar({ input, setInput, onSend, onQuickQuestion, disabled }) {
    const [ocrLoading, setOcrLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && input.trim()) onSend();
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setOcrLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/ocr", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("OCR API request failed");
            }

            const data = await response.json();
            const extractedText = data.text ? data.text.trim() : "";
            
            // Append the extracted text to whatever the user has currently typed
            const prefix = input ? input + '\n' : '';
            setInput(prefix + extractedText);
            
        } catch (err) {
            console.error("OCR Failed:", err);
            alert("Failed to extract text from the image. Please try a clearer photo!");
        } finally {
            setOcrLoading(false);
            // Reset input so they can upload another image immediately if they want to
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const triggerUpload = () => {
        if (!disabled && !ocrLoading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="bottom-bar">
            <div className="quick-questions">
                <span className="quick-label">Explore:</span>
                {QUICK.map(q => (
                    <button key={q} className="quick-btn" onClick={() => onQuickQuestion(q)} disabled={disabled || ocrLoading}>{q}</button>
                ))}
            </div>
            <div className="input-row">
                <div className="input-wrap">
                    <button
                        className="upload-btn"
                        title="Scan MCQ Photo"
                        onClick={triggerUpload}
                        disabled={disabled || ocrLoading}
                    >
                        {ocrLoading ? '⏳' : '📷'}
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                    />
                    <input
                        className="input-field" type="text"
                        placeholder={ocrLoading ? "Scanning image..." : "Ask anything about biology…"}
                        value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown} disabled={disabled || ocrLoading} autoComplete="off"
                    />
                </div>
                <button className="send-btn" onClick={onSend} disabled={disabled || ocrLoading || !input.trim()} aria-label="Send">
                    ↑
                </button>
            </div>
        </div>
    );
}
