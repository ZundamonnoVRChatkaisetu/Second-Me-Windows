import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  type?: 'spinner' | 'dots' | 'pulse' | 'progress';
  progress?: number; // 0-100の値 (progressタイプの場合)
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * ローディング中の状態を表示するコンポーネント
 * 様々なスタイルのローディングアニメーションを提供
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'md',
  color,
  type = 'spinner',
  progress = 0,
  text,
  fullScreen = false,
  className = '',
}) => {
  const { theme } = useTheme();
  
  // テーマに基づいたデフォルトカラー
  const defaultColor = theme === 'dark' ? '#60a5fa' : '#3b82f6'; // ダークモード：light blue, ライトモード：blue
  const fillColor = color || defaultColor;
  
  // サイズに基づく寸法
  const dimensions = {
    sm: { width: 16, height: 16, text: 'text-xs' },
    md: { width: 32, height: 32, text: 'text-sm' },
    lg: { width: 48, height: 48, text: 'text-base' },
  };
  
  const { width, height, text: textSize } = dimensions[size];
  
  // コンテナクラス名
  const containerClassName = `flex flex-col items-center justify-center ${
    fullScreen ? 'fixed inset-0 bg-white/80 dark:bg-gray-900/80 z-50' : ''
  } ${className}`;

  // スピナーアニメーション（円形のローディングアニメーション）
  const renderSpinner = () => (
    <motion.div
      className="relative"
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 border-2 rounded-full"
        style={{ 
          borderColor: `${fillColor} transparent transparent transparent`,
          width: '100%',
          height: '100%'
        }}
        animate={{ rotate: 360 }}
        transition={{ 
          repeat: Infinity, 
          duration: 1, 
          ease: "linear" 
        }}
      />
    </motion.div>
  );

  // ドットアニメーション（点が並んで動くアニメーション）
  const renderDots = () => {
    const dotSize = width / 5;
    const dotVariants = {
      hidden: { opacity: 0.5, scale: 0.5 },
      visible: { opacity: 1, scale: 1 }
    };

    return (
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{ 
              width: dotSize, 
              height: dotSize, 
              backgroundColor: fillColor 
            }}
            variants={dotVariants}
            initial="hidden"
            animate="visible"
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 0.5,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    );
  };

  // パルスアニメーション（大きさが変化するアニメーション）
  const renderPulse = () => (
    <motion.div
      className="rounded-full"
      style={{ 
        width, 
        height, 
        backgroundColor: fillColor,
        opacity: 0.7
      }}
      animate={{ scale: [0.8, 1.2, 0.8] }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: "easeInOut"
      }}
    />
  );

  // プログレスバーアニメーション（進捗状況を表示）
  const renderProgress = () => (
    <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: fillColor }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );

  // タイプに基づいてローディングインジケーターをレンダリング
  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'progress':
        return renderProgress();
      case 'spinner':
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={containerClassName}>
      {renderLoader()}
      
      {text && (
        <motion.p 
          className={`mt-2 ${textSize} text-gray-600 dark:text-gray-300`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
      
      {type === 'progress' && (
        <p className={`mt-1 ${textSize} text-gray-600 dark:text-gray-300`}>
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
};

export default LoadingIndicator;
