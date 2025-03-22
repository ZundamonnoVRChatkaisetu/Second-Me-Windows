import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Card コンポーネント
 * コンテンツをカード形式で表示するためのコンテナ
 */
const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardHeader コンポーネント
 * カードのヘッダー部分
 */
const CardHeader: React.FC<CardHeaderProps> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardTitle コンポーネント
 * カードのタイトル
 */
const CardTitle: React.FC<CardTitleProps> = ({ className = '', children, ...props }) => {
  return (
    <h3
      className={`text-xl font-semibold text-gray-900 dark:text-gray-100 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

/**
 * CardDescription コンポーネント
 * カードの説明文
 */
const CardDescription: React.FC<CardDescriptionProps> = ({ className = '', children, ...props }) => {
  return (
    <p
      className={`mt-1 text-sm text-gray-500 dark:text-gray-400 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

/**
 * CardContent コンポーネント
 * カードのメインコンテンツ
 */
const CardContent: React.FC<CardContentProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * CardFooter コンポーネント
 * カードのフッター部分
 */
const CardFooter: React.FC<CardFooterProps> = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
