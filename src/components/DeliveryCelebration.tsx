import { useEffect, useState } from 'react';
import { CheckCircle, Sparkles, Star, PartyPopper, Trophy, Award } from 'lucide-react';

interface DeliveryCelebrationProps {
  ticketTitle?: string;
  onComplete?: () => void;
  duration?: number;
  delay?: number;
}

export function DeliveryCelebration({ 
  ticketTitle, 
  onComplete, 
  duration = 4000,
  delay = 500 
}: DeliveryCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; color: string }>>([]);

  useEffect(() => {
    // Generate confetti particles for full-screen effect
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#EF4444'];
    const newParticles = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20, // Start above viewport
      delay: Math.random() * 400,
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

  const displayTitle = ticketTitle || 'Servis Talebi';

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center bg-black bg-opacity-40">
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
              animationDuration: `${3.5 + Math.random() * 1.5}s`,
            }}
          />
        ))}
        {/* Additional smaller particles */}
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={`small-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-10 - Math.random() * 20}%`,
              backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'][i % 5],
              animationDelay: `${Math.random() * 600}ms`,
              animationDuration: `${3 + Math.random() * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Center celebration content */}
      <div className="relative animate-scale-in z-10">
        <div className="bg-white rounded-2xl p-10 shadow-2xl max-w-lg mx-4 text-center border-4 border-green-200">
          <div className="relative mb-6">
            <div className="absolute -top-6 -right-6">
              <Sparkles className="w-10 h-10 text-yellow-400 animate-spin" style={{ animationDuration: '2s' }} />
            </div>
            <div className="absolute -bottom-6 -left-6">
              <Star className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>
            <div className="absolute -top-6 -left-6">
              <PartyPopper className="w-8 h-8 text-purple-400 animate-bounce" />
            </div>
            <div className="absolute -bottom-6 -right-6">
              <Award className="w-7 h-7 text-amber-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <div className="flex items-center justify-center">
              <Trophy className="w-16 h-16 text-amber-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <CheckCircle className="w-20 h-20 text-green-500 animate-scale-in" />
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Tebrikler! 🎉
          </h2>
          <p className="text-xl text-gray-700 mb-3 font-semibold">
            Servis başarıyla tamamlandı!
          </p>
          <p className="text-base text-gray-600 mb-2">
            {displayTitle}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Müşteriye teslim edilmeye hazır
          </p>
        </div>
      </div>
    </div>
  );
}
