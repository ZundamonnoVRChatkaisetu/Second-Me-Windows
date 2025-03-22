import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

/**
 * Badge コンポーネント
 * ステータスやカテゴリなどを表示するための小さなラベル
 */
const Badge: React.FC<BadgeProps> = ({ 
  className = '', 
  variant = 'default', 
  children, 
  ...props 
}) => {
  // バリアントに応じたスタイルを定義
  const variantStyles = {
    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    outline: 'border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Badge };
