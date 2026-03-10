import { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import BottomBar from './components/BottomBar';
import Particles from './components/Particles';
import AuthPage from './components/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const API_BASE = '';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  text: '## Welcome to A/L BioBot 🧬\n\nI\'m your intelligent biology companion, powered by a curated knowledge base built for A/L Biology.\n\nAsk me anything about **cells**, **DNA & genetics**, **photosynthesis**, **ecosystems**, **evolution**, and much more. Let\'s explore the science of life together.',
  time: new Date(),
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

  const sendMessage = useCallback(
    async (text) => {
      const question = (text ?? input).trim();
      if (!question || loading) return;

      const userMsg = { id: Date.now(), role: 'user', text: question, time: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/qa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ question }),
        });
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data = await res.json();
        const botMsg = {
          id: Date.now() + 1, role: 'bot',
          text: data.answer || 'I could not find an answer for that.',
          citations: data.citations, time: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        const errMsg = {
          id: Date.now() + 2, role: 'bot',
          text: '**Connection Error**\n\nCould not reach the backend server. Please ensure it is running and try again.',
          error: true, time: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, token],
  );

  if (!token) return <AuthPage />;

  return (
    <>
      <div className="bg-scene">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="bg-grid" />
      </div>
      <div className="app">
        <Header />
        <Particles />
        <ChatArea messages={messages} loading={loading} chatEndRef={chatEndRef} />
        <BottomBar
          input={input} setInput={setInput}
          onSend={() => sendMessage()} onQuickQuestion={sendMessage}
          disabled={loading}
        />
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
