import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
  transitionType?: 'fade' | 'slide' | 'scale' | 'none';
}

/**
 * ページ遷移アニメーションを提供するコンポーネント
 * Framer Motionを使用して滑らかなページ間遷移を実現
 */
const AnimatedPage: React.FC<AnimatedPageProps> = ({ 
  children,
  className = '',
  transitionType = 'fade'
}) => {
  const router = useRouter();

  // トランジションタイプに基づいて異なるアニメーション設定
  const getAnimationVariants = () => {
    switch (transitionType) {
      case 'slide':
        return {
          initial: { opacity: 0, x: -200 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 200 }
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 }
        };
      case 'none':
        return {
          initial: {},
          animate: {},
          exit: {}
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };
  
  const variants = getAnimationVariants();

  // 現在のルートをキーとして使用して、ページごとのアニメーションを保証
  return (
    <motion.div
      key={router.route}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{
        duration: 0.3, // アニメーション期間
        ease: 'easeInOut' // イージング関数
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
