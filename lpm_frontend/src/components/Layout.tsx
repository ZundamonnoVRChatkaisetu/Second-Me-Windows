import React from 'react';
import NavigationHeader from './NavigationHeader';
import Footer from './Footer';
import { cn } from '../lib/utils';
import { useAppContext } from '@/lib/AppContext';
import LoadingIndicator from './LoadingIndicator';
import { useTheme } from './ThemeProvider';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
  className?: string;
}

/**
 * 共通レイアウトコンポーネント
 * ヘッダーとフッターを含む基本レイアウト
 * ルーティング問題を解消するためにAnimationWrapperとAnimatedPageを削除
 */
const Layout: React.FC<LayoutProps> = ({
  children,
  hideNav = false,
  hideFooter = false,
  className = '',
}) => {
  const { isLoading, loadingMessage, error, backendConnected } = useAppContext();
  const { theme } = useTheme();

  return (
    <div className={`flex flex-col min-h-screen page-background`}>
      {!hideNav && <NavigationHeader />}
      
      <main className={cn('flex-grow', className)}>
        {/* ローディングインジケーター */}
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50">
            <LoadingIndicator 
              size="lg" 
              text={loadingMessage || 'ロード中...'}
              type="spinner"
            />
          </div>
        )}
        
        {/* バックエンド接続状態通知 */}
        {!backendConnected && (
          <div className={`w-full py-2 px-4 text-center ${
            theme === 'dark' 
              ? 'bg-red-900 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <p className="text-sm">
              バックエンドサービスに接続できません。一部の機能が利用できない可能性があります。
            </p>
          </div>
        )}
        
        {/* エラーメッセージ */}
        {error && (
          <div className={`w-full py-2 px-4 text-center ${
            theme === 'dark' 
              ? 'bg-amber-900 text-white' 
              : 'bg-amber-500 text-white'
          }`}>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {/* コンテンツをそのまま表示 */}
        <div className="flex-grow">
          {children}
        </div>
      </main>
      
      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;
