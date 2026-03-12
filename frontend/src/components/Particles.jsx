import { useState } from 'react';
const rand = (a, b) => Math.random() * (b - a) + a;
const mkP = id => ({ id, size: rand(4,11), left: rand(5,95), dur: rand(15,30), delay: rand(0,20), top: rand(65,100) });
export default function Particles() {
  const [ps] = useState(() => Array.from({ length: 12 }, (_, i) => mkP(i)));
  return (
    <div className="particles-container">
      {ps.map(p => (
        <div key={p.id} className="particle" style={{
          width: p.size, height: p.size, left: `${p.left}%`, top: `${p.top}%`,
          animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}
