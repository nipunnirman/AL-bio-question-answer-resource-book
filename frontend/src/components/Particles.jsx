import { useState } from 'react';

function rand(min, max) { return Math.random() * (max - min) + min; }
function mkP(id) {
  return { id, size: rand(4, 12), left: rand(5, 95), duration: rand(14, 28), delay: rand(0, 18), startTop: rand(65, 100) };
}

export default function Particles() {
  const [particles] = useState(() => Array.from({ length: 14 }, (_, i) => mkP(i)));
  return (
    <div className="particles-container">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          width: p.size, height: p.size, left: `${p.left}%`, top: `${p.startTop}%`,
          animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}
