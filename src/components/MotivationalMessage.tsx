import { useEffect, useState } from 'react';
import { CheckCircle, Trophy, Star, Zap, Target, TrendingUp, Sparkles } from 'lucide-react';

interface MotivationalMessageProps {
  type: 'success' | 'achievement' | 'improvement' | 'milestone';
  message?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const messageVariations = {
  success: [
    { icon: CheckCircle, text: 'Harika! İşleminiz başarıyla tamamlandı! 🎉', color: 'green' },
    { icon: Star, text: 'Mükemmel iş! Devam edin! ⭐', color: 'yellow' },
    { icon: Zap, text: 'Süper! Hızlı ve etkili çalışıyorsunuz! ⚡', color: 'blue' },
    { icon: Target, text: 'Hedefe ulaştınız! Tebrikler! 🎯', color: 'purple' },
  ],
  achievement: [
    { icon: Trophy, text: 'Harika bir başarı! Performansınız artıyor! 🏆', color: 'gold' },
    { icon: Star, text: 'Yıldız performans gösteriyorsunuz! ⭐', color: 'yellow' },
    { icon: TrendingUp, text: 'İlerleme kaydediyorsunuz! Devam edin! 📈', color: 'green' },
    { icon: Sparkles, text: 'Parlak bir iş çıkardınız! ✨', color: 'purple' },
  ],
  improvement: [
    { icon: TrendingUp, text: 'Performansınız geçen aya göre iyileşiyor! 📈', color: 'green' },
    { icon: Target, text: 'Hedeflerinize yaklaşıyorsunuz! 🎯', color: 'blue' },
    { icon: Zap, text: 'Hızınız artıyor! Bu tempo ile devam! ⚡', color: 'purple' },
    { icon: Star, text: 'İyileşme gösteriyorsunuz! Harika! ⭐', color: 'yellow' },
  ],
  milestone: [
    { icon: Trophy, text: 'Önemli bir kilometre taşına ulaştınız! 🏆', color: 'gold' },
    { icon: Sparkles, text: 'Muhteşem bir başarı! Kutlamaya değer! ✨', color: 'purple' },
    { icon: Star, text: 'Dönüm noktası! Tebrikler! ⭐', color: 'yellow' },
    { icon: Target, text: 'Büyük bir hedefi gerçekleştirdiniz! 🎯', color: 'blue' },
  ],
};

const colorClasses = {
  green: 'from-green-50 to-emerald-50 border-green-200 text-green-900',
  yellow: 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-900',
  blue: 'from-blue-50 to-cyan-50 border-blue-200 text-blue-900',
  purple: 'from-purple-50 to-pink-50 border-purple-200 text-purple-900',
  gold: 'from-amber-50 to-yellow-50 border-amber-200 text-amber-900',
};

const iconColorClasses = {
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  gold: 'bg-amber-100 text-amber-600',
};

export function MotivationalMessage({
  type,
  message,
  onClose,
  autoClose = true,
  duration = 4000,
}: MotivationalMessageProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<{
    icon: React.ComponentType<{ className?: string }>;
    text: string;
    color: keyof typeof colorClasses;
  }>(() => {
    const variations = messageVariations[type];
    return variations[Math.floor(Math.random() * variations.length)];
  });

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!isVisible) return null;

  const Icon = selectedMessage.icon;
  const colorClass = colorClasses[selectedMessage.color];
  const iconColorClass = iconColorClasses[selectedMessage.color];

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 bg-gradient-to-r ${colorClass} rounded-lg border shadow-lg animate-fade-in max-w-md`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconColorClass} rounded-full animate-pulse`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{message || selectedMessage.text}</p>
        </div>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose?.(), 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
