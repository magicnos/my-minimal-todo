'use client';

import { useState, useEffect } from 'react';

/**
 * レベルアップ時の演出コンポーネント
 */
export default function LevelUpOverlay({ level, onComplete }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // 30個のキラキラ粒子を生成
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      dx: `${(Math.random() - 0.5) * 400}px`,
      dy: `${(Math.random() - 0.5) * 400}px`,
    }));
    setParticles(newParticles);

    // 3秒後に演出終了
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="level-up-overlay">
      <div className="level-up-content">
        <h2 className="level-up-text">LEVEL UP!</h2>
        <div className="level-up-number">Lv.{level}</div>
        
        {/* キラキラ粒子 */}
        {particles.map(p => (
          <div 
            key={p.id} 
            className="sparkle" 
            style={{ '--dx': p.dx, '--dy': p.dy }}
          />
        ))}
      </div>
    </div>
  );
}
