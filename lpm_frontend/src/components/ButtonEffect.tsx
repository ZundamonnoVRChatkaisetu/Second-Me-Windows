import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ButtonEffectProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  effect?: 'scale' | 'pulse' | 'bounce' | 'ripple' | 'none';
  duration?: number;
  color?: string;
}

/**
 * インタラクティブなボタン効果を提供するコンポーネント
 * クリック時などにさまざまなアニメーション効果を適用
 */
const ButtonEffect: React.FC<ButtonEffectProps> = ({
  children,
  onClick,
  disabled = false,
  className = '',
  effect = 'scale',
  duration = 0.2,
  color = 'rgba(59, 130, 246, 0.5)' // デフォルトはブルー系
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });

  // クリックハンドラー
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // rippleエフェクトの場合は、クリック位置を取得
    if (effect === 'ripple') {
      const button = e.currentTarget;
      const buttonRect = button.getBoundingClientRect();
      const x = e.clientX - buttonRect.left;
      const y = e.clientY - buttonRect.top;
      setRipplePosition({ x, y });
    }
    
    // アニメーション開始
    setIsAnimating(true);
    
    // アニメーション終了後にリセット
    setTimeout(() => {
      setIsAnimating(false);
    }, duration * 1000);
    
    // 元のクリックイベントを呼び出し
    if (onClick) {
      onClick();
    }
  };

  // エフェクトに基づいてアニメーション設定を取得
  const getAnimationVariants = () => {
    switch (effect) {
      case 'scale':
        return {
          initial: { scale: 1 },
          animate: isAnimating ? { scale: 0.95 } : { scale: 1 }
        };
      case 'pulse':
        return {
          initial: { scale: 1 },
          animate: isAnimating ? { scale: [1, 1.05, 1] } : { scale: 1 }
        };
      case 'bounce':
        return {
          initial: { y: 0 },
          animate: isAnimating ? { y: [-2, 0] } : { y: 0 }
        };
      case 'ripple':
      case 'none':
      default:
        return {
          initial: {},
          animate: {}
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{ duration }}
      onClick={handleClick}
      disabled={disabled}
      whileHover={effect !== 'none' ? { scale: 1.02 } : {}}
      whileTap={effect !== 'none' && effect !== 'ripple' ? { scale: 0.98 } : {}}
    >
      {children}
      
      {/* Rippleエフェクト */}
      {effect === 'ripple' && isAnimating && (
        <motion.span
          className="absolute rounded-full"
          style={{
            left: ripplePosition.x,
            top: ripplePosition.y,
            backgroundColor: color,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
          initial={{ width: 0, height: 0, opacity: 0.6 }}
          animate={{ width: 300, height: 300, opacity: 0 }}
          transition={{ duration: duration * 2, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  );
};

export default ButtonEffect;
