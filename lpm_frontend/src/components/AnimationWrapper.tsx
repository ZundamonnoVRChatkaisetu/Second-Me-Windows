import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimationWrapperProps {
  children: React.ReactNode;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  duration?: number;
  delay?: number;
  className?: string;
  staggerChildren?: boolean;
  staggerDelay?: number;
}

/**
 * アニメーション効果を追加するラッパーコンポーネント
 * Framer Motionを使用して様々なアニメーション効果を適用
 */
export const AnimationWrapper: React.FC<AnimationWrapperProps> = ({
  children,
  animation = 'fade',
  duration = 0.3,
  delay = 0,
  className = '',
  staggerChildren = false,
  staggerDelay = 0.1,
}) => {
  // アニメーションのバリアントを定義
  const variants = {
    // フェードインアニメーション
    fade: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { 
          duration,
          delay,
          staggerChildren: staggerChildren ? staggerDelay : 0 
        }
      },
      exit: { 
        opacity: 0,
        transition: { duration: duration / 2 }
      }
    },
    
    // スライドインアニメーション
    slide: {
      hidden: { x: -20, opacity: 0 },
      visible: { 
        x: 0, 
        opacity: 1,
        transition: { 
          duration,
          delay,
          type: 'spring',
          stiffness: 400,
          damping: 40,
          staggerChildren: staggerChildren ? staggerDelay : 0
        }
      },
      exit: { 
        x: 20, 
        opacity: 0,
        transition: { duration: duration / 2 }
      }
    },
    
    // スケールアニメーション
    scale: {
      hidden: { scale: 0.95, opacity: 0 },
      visible: { 
        scale: 1, 
        opacity: 1,
        transition: { 
          duration,
          delay,
          type: 'spring',
          staggerChildren: staggerChildren ? staggerDelay : 0
        }
      },
      exit: { 
        scale: 0.95, 
        opacity: 0,
        transition: { duration: duration / 2 }
      }
    },
    
    // アニメーションなし
    none: {
      hidden: {},
      visible: {},
      exit: {}
    }
  };

  // 選択されたアニメーションのバリアントを取得
  const selectedVariant = variants[animation];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={className}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={selectedVariant}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * 子要素に使用するアニメーション用コンポーネント
 * staggerChildrenと共に使用
 */
export const AnimationItem: React.FC<Omit<AnimationWrapperProps, 'staggerChildren' | 'staggerDelay'>> = ({
  children,
  animation = 'fade',
  duration = 0.3,
  delay = 0,
  className = '',
}) => {
  // アニメーションのバリアントを定義
  const variants = {
    // フェードインアニメーション
    fade: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration, delay }
      },
      exit: { 
        opacity: 0,
        transition: { duration: duration / 2 }
      }
    },
    
    // スライドインアニメーション
    slide: {
      hidden: { x: -20, opacity: 0 },
      visible: { 
        x: 0, 
        opacity: 1,
        transition: { 
          duration,
          delay,
          type: 'spring',
          stiffness: 400,
          damping: 40
        }
      },
      exit: { 
        x: 20, 
        opacity: 0,
        transition: { duration: duration / 2 }
      }
    },
    
    // スケールアニメーション
    scale: {
      hidden: { scale: 0.95, opacity: 0 },
      visible: { 
        scale: 1, 
        opacity: 1,
        transition: { 
          duration,
          delay,
          type: 'spring'
        }
      },
      exit: { 
        scale: 0.95, 
        opacity: 0,
        transition: { duration: duration / 2 }
      }
    },
    
    // アニメーションなし
    none: {
      hidden: {},
      visible: {},
      exit: {}
    }
  };

  // 選択されたアニメーションのバリアントを取得
  const selectedVariant = variants[animation];

  return (
    <motion.div
      className={className}
      variants={selectedVariant}
    >
      {children}
    </motion.div>
  );
};
