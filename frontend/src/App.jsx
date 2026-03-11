import { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import BottomBar from './components/BottomBar';
import Particles from './components/Particles';
import AuthPage from './components/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const WELCOME_MESSAGE = {
  id: 'welcome', role: 'bot', time: new Date(),
  text: `## Hello! I'm your A/L Biology Assistant 🌿\n\nI'm powered by a curated biology knowledge base. Ask me anything about:\n\n- **Cell biology** — structure, organelles, processes\n- **Genetics & DNA** — replication, transcription, inheritance\n- **Ecology** — ecosystems, food chains, biodiversity\n- **Evolution** — natural selection, adaptation\n- **Physiology** — how organisms work from within\n\nWhat would you like to explore today?`,
};

function MainApp() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    const userMsgId = Date.now();
    const botMsgId = userMsgId + 1;

    setMessages(prev => [
      ...prev, 
      { id: userMsgId, role: 'user', text: question, time: new Date() },
      { id: botMsgId, role: 'bot', text: '', time: new Date() }
    ]);
    
    setInput('');
    setLoading(true);
    let fullAnswer = "";

    try {
      const res = await fetch('/qa/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ question }),
      });
      
      if (!res.ok) throw new Error(`${res.status}`);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.answer_chunk) {
                fullAnswer += parsed.answer_chunk;
                setMessages(prev => prev.map(msg => 
                  msg.id === botMsgId ? { ...msg, text: fullAnswer } : msg
                ));
              }
              if (parsed.context || parsed.citations) {
                setMessages(prev => prev.map(msg => 
                  msg.id === botMsgId ? { ...msg, context: parsed.context || msg.context, citations: parsed.citations || msg.citations } : msg
                ));
              }
            } catch (e) {
              console.error("Error parsing stream chunk:", e);
            }
          }
        }
      }
    } catch {
      setMessages(prev => [...prev.filter(m => m.id !== botMsgId), {
        id: Date.now() + 2, role: 'bot', error: true, time: new Date(),
        text: '**Connection error.** Make sure the backend server is running and try again.',
      }]);
    } finally {
      if (!fullAnswer) {
          setMessages(prev => prev.map(msg => 
              msg.id === botMsgId && msg.text === '' ? { ...msg, text: 'I could not find an answer for that.' } : msg
          ));
      }
      setLoading(false);
    }
  }, [input, loading, token]);

  if (!token) return <AuthPage />;

  return (
    <>
      <div className="bg-scene">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
      </div>
      <div className="app">
        <Header />
        <Particles />
        <ChatArea messages={messages} loading={loading} chatEndRef={chatEndRef} />
        <BottomBar input={input} setInput={setInput} onSend={() => sendMessage()} onQuickQuestion={sendMessage} disabled={loading} />
      </div>
    </>
  );
}

export default function App() {
  return <AuthProvider><MainApp /></AuthProvider>;
}
