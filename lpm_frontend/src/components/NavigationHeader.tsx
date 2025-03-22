import React from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from './ThemeProvider';
import { Settings } from 'lucide-react';

/**
 * アプリケーションのナビゲーションヘッダーコンポーネント
 * オリジナルSecond Meのヘッダーと同様のデザイン
 */
const NavigationHeader: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <header className={`w-full ${
      theme === 'dark' 
        ? 'bg-gray-900 border-gray-800' 
        : 'bg-blue-600 border-blue-700'
    } border-b transition-colors duration-200`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* ロゴとブランド */}
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center">
            <div className={`w-8 h-8 rounded-full ${
              theme === 'dark' ? 'bg-blue-800' : 'bg-blue-100'
            } flex items-center justify-center mr-2`}>
              <div className={`w-6 h-6 rounded-full ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'
              }`}></div>
            </div>
            <span className="text-white font-medium text-lg">Second Me</span>
          </Link>
        </div>

        {/* ナビゲーションリンク - 中央配置 */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/chat" className="text-blue-100 hover:text-white transition-colors">
            チャット
          </Link>
          <Link href="/network" className="text-blue-100 hover:text-white transition-colors">
            ネットワーク
          </Link>
          <Link href="/about" className="text-blue-100 hover:text-white transition-colors">
            概要
          </Link>
          <Link href="/docs" className="text-blue-100 hover:text-white transition-colors">
            ドキュメント
          </Link>
        </nav>

        {/* 右側のアクション */}
        <div className="flex items-center space-x-4">
          {/* 設定ページへのリンク */}
          <Link href="/settings" className="text-blue-100 hover:text-white transition-colors">
            <Settings size={20} />
          </Link>
          
          {/* テーマ切り替えボタン */}
          <ThemeToggle className="text-white" />
          
          <Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows" 
                target="_blank"
                className="text-blue-100 hover:text-white transition-colors hidden md:inline-block">
            GitHub でスターを付ける
          </Link>
          
          <Link href="/create">
            <Button 
              variant="primary" 
              size="sm" 
              rounded="full" 
              className={`${
                theme === 'dark' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              第二の自分を作る
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default NavigationHeader;
