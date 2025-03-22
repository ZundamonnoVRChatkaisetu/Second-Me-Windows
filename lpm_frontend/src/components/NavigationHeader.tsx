import React from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';

/**
 * アプリケーションのナビゲーションヘッダーコンポーネント
 * オリジナルSecond Meのヘッダーと同様のデザイン
 */
const NavigationHeader: React.FC = () => {
  return (
    <header className="w-full bg-blue-600 border-b border-blue-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* ロゴとブランド */}
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
              <div className="w-6 h-6 rounded-full bg-blue-400"></div>
            </div>
            <span className="text-white font-medium text-lg">Second Me</span>
          </Link>
        </div>

        {/* ナビゲーションリンク - 中央配置 */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/explore" className="text-blue-100 hover:text-white transition-colors">
            探索
          </Link>
          <Link href="/network" className="text-blue-100 hover:text-white transition-colors">
            ネットワーク
          </Link>
          <Link href="/about" className="text-blue-100 hover:text-white transition-colors">
            概要
          </Link>
        </nav>

        {/* 右側のアクション */}
        <div className="flex items-center space-x-4">
          <Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows" 
                target="_blank"
                className="text-blue-100 hover:text-white transition-colors">
            GitHub でスターを付ける
          </Link>
          <Link href="https://www.secondme.io/whitepaper" 
                target="_blank"
                className="text-blue-100 hover:text-white transition-colors">
            ホワイトペーパー
          </Link>
          <Button variant="primary" size="sm" rounded="full" className="bg-white text-blue-600 hover:bg-blue-50">
            第二の自分を作る
          </Button>
        </div>
      </div>
    </header>
  );
};

export default NavigationHeader;
