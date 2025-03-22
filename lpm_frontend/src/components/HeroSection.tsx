import React from 'react';
import { Button } from './ui/Button';
import Link from 'next/link';

/**
 * ホームページのヒーローセクションコンポーネント
 */
const HeroSection: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-b from-blue-50 to-white py-16 md:py-24 overflow-hidden">
      {/* 装飾的な背景要素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-yellow-300 opacity-70"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 rounded-full bg-red-300 opacity-60"></div>
        <div className="absolute top-2/3 left-1/3 w-3 h-3 rounded-full bg-green-300 opacity-70"></div>
        <div className="absolute bottom-1/4 right-1/3 w-5 h-5 rounded-full bg-blue-300 opacity-60"></div>
        <div className="absolute top-10 right-10 w-8 h-8 rounded-full bg-purple-300 opacity-50"></div>
        <div className="absolute bottom-20 left-20 w-6 h-6 rounded-full bg-pink-300 opacity-60"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* アイコン */}
          <div className="mb-6 inline-flex">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-blue-400"></div>
            </div>
          </div>

          {/* メインヘッダー */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            <span className="inline">AIセルフを</span>
            <span className="inline">作成する</span>
          </h1>

          {/* サブヘッダー */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            現地で訓練を受けた・グローバル接続
          </p>

          {/* ネットワーク情報 */}
          <p className="text-gray-500 mb-8">
            54 ネットワーク内の Second Me
          </p>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link href="/create">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full sm:w-auto"
              >
                第二の自分を作る
              </Button>
            </Link>
            <Link href="/docs">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto"
              >
                詳細を学ぶ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
