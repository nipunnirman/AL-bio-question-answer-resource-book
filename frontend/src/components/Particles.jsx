import { useEffect, useState } from 'react';

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function createParticle(id) {
    return {
        id,
        size: randomBetween(4, 14),
        left: randomBetween(5, 95),
        duration: randomBetween(12, 25),
        delay: randomBetween(0, 15),
        startTop: randomBetween(60, 100),
    };
}

const PARTICLE_COUNT = 18;

export default function Particles() {
    const [particles] = useState(() =>
        Array.from({ length: PARTICLE_COUNT }, (_, i) => createParticle(i)),
    );

    return (
        <div className="particles-container">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="particle"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.left}%`,
                        top: `${p.startTop}%`,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}
