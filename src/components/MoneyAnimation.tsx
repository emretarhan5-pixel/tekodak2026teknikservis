import { useEffect, useState } from 'react';
import { DollarSign, Coins, Banknote } from 'lucide-react';

interface MoneyAnimationProps {
  amount: number;
  onComplete?: () => void;
  duration?: number;
}

export function MoneyAnimation({ amount, onComplete, duration = 3000 }: MoneyAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; rotation: number }>>([]);

  useEffect(() => {
    // Generate money particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 40, // Center around 50%
      y: 50 + (Math.random() - 0.5) * 40,
      delay: Math.random() * 300,
      rotation: Math.random() * 360,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none flex items-center justify-center">
      {/* Animated money particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute animate-money-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}ms`,
              animationDuration: `${2 + Math.random()}s`,
            }}
          >
            <div
              className="text-yellow-400"
              style={{
                transform: `rotate(${particle.rotation}deg)`,
              }}
            >
              {particle.id % 3 === 0 ? (
                <DollarSign className="w-8 h-8" />
              ) : particle.id % 3 === 1 ? (
                <Coins className="w-8 h-8" />
              ) : (
                <Banknote className="w-8 h-8" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Center amount display */}
      <div className="relative z-10 animate-scale-in">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 shadow-2xl border-4 border-yellow-400">
          <div className="text-center">
            <div className="mb-4">
              <DollarSign className="w-16 h-16 text-yellow-300 mx-auto animate-bounce" />
            </div>
            <p className="text-white text-sm font-semibold mb-2 uppercase tracking-wide">Kazanç</p>
            <p className="text-5xl font-bold text-white mb-2">{formatAmount(amount)}</p>
            <p className="text-yellow-200 text-sm">Tebrikler! 🎉</p>
          </div>
        </div>
      </div>
    </div>
  );
}
