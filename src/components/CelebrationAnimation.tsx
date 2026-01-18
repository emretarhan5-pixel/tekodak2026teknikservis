import { useEffect, useState } from 'react';
import { CheckCircle, Sparkles, Star, PartyPopper } from 'lucide-react';

interface CelebrationAnimationProps {
  staffName?: string;
  onComplete?: () => void;
  duration?: number;
  delay?: number;
}

export function CelebrationAnimation({ 
  staffName, 
  onComplete, 
  duration = 3000,
  delay = 1000 
}: CelebrationAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; color: string }>>([]);

  useEffect(() => {
    // Generate confetti particles for full-screen effect
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    const newParticles = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20, // Start above viewport
      delay: Math.random() * 300,
      color: colors[i % colors.length],
    }));
    setParticles(newParticles);

    // Show celebration after delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    // Hide celebration after duration
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 300);
    }, delay + duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [delay, duration, onComplete]);

  if (!isVisible) return null;

  const displayName = staffName?.split(' ')[0] || 'Takım Üyesi'; // Use first name or default

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center bg-black bg-opacity-30">
      {/* Full-screen confetti */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-3 h-3 rounded-full animate-confetti"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              animationDelay: `${particle.delay}ms`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
        {/* Additional smaller particles */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`small-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-10 - Math.random() * 20}%`,
              backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5],
              animationDelay: `${Math.random() * 500}ms`,
              animationDuration: `${2.5 + Math.random() * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Center celebration content */}
      <div className="relative animate-scale-in z-10">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4 text-center">
          <div className="relative mb-6">
            <div className="absolute -top-4 -right-4">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" style={{ animationDuration: '2s' }} />
            </div>
            <div className="absolute -bottom-4 -left-4">
              <Star className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
            <div className="absolute -top-4 -left-4">
              <PartyPopper className="w-6 h-6 text-purple-400 animate-bounce" />
            </div>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto animate-bounce" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Tebrikler {displayName}! 🎉
          </h2>
          <p className="text-lg text-gray-700 mb-2">
            Servis talebi başarıyla oluşturuldu
          </p>
          <p className="text-sm text-gray-500">
            Mükemmel iş çıkardınız!
          </p>
        </div>
      </div>
    </div>
  );
}