import React from 'react';
import NavigationHeader from './NavigationHeader';
import Footer from './Footer';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
  className?: string;
}

/**
 * 共通レイアウトコンポーネント
 * ヘッダーとフッターを含む基本レイアウト
 */
const Layout: React.FC<LayoutProps> = ({
  children,
  hideNav = false,
  hideFooter = false,
  className = '',
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      {!hideNav && <NavigationHeader />}
      
      <main className={cn('flex-grow', className)}>
        {children}
      </main>
      
      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;
