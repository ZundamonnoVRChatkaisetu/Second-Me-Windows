import React from 'react';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';

/**
 * アプリケーションのフッターコンポーネント
 */
const Footer: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <footer className={`${
      theme === 'dark' 
        ? 'bg-gray-900 border-gray-800 text-gray-300' 
        : 'bg-white border-gray-200 text-gray-600'
    } border-t py-8 transition-colors duration-200`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ブランドセクション */}
          <div className="col-span-1">
            <div className="flex items-center mb-4">
              <div className={`w-8 h-8 rounded-full ${
                theme === 'dark' ? 'bg-blue-800' : 'bg-blue-100'
              } flex items-center justify-center mr-2`}>
                <div className={`w-6 h-6 rounded-full ${
                  theme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'
                }`}></div>
              </div>
              <span className={`${
                theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
              } font-medium text-lg`}>Second Me</span>
            </div>
            <p className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            } text-sm`}>
              あなた自身のAI自己をWindowsで実現。
              プライバシーとコントロールを保ちながら、
              あなたのデジタルアイデンティティを拡張します。
            </p>
          </div>

          {/* 製品セクション */}
          <div className="col-span-1">
            <h3 className={`text-sm font-semibold ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            } uppercase tracking-wider mb-4`}>製品</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className={`${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-600 hover:text-gray-900'
                } text-sm`}>
                  機能
                </Link>
              </li>
              <li>
                <Link href="/create" className={`${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-600 hover:text-gray-900'
                } text-sm`}>
                  AIセルフの作成
                </Link>
              </li>
              <li>
                <Link href="/network" className={`${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-600 hover:text-gray-900'
                } text-sm`}>
                  ネットワーク
                </Link>
              </li>
              <li>
                <Link href="/chat" className={`${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-600 hover:text-gray-900'
                } text-sm`}>
                  チャットインターフェイス
                </Link>
              </li>
            </ul>
          </div>

          {/* リソースセクション */}
          <div className="col-span-1">
            <h3 className={`text-sm font-semibold ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            } uppercase tracking-wider mb-4`}>リソース</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs" className={`${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-600 hover:text-gray-900'
                } text-sm`}>
                  ドキュメント
                </Link>
              </li>
              <li>
                <Link href="/about" className={`${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-600 hover:text-gray-900'
                } text-sm`}>
                  プロジェクト概要
                </Link>
              </li>
              <li>
                <Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows" 
                      target="_blank" 
                      className={`${
                        theme === 'dark' 
                          ? 'text-gray-400 hover:text-gray-200' 
                          : 'text-gray-600 hover:text-gray-900'
                      } text-sm`}>
                  GitHub
                </Link>
              </li>
            </ul>
          </div>

          {/* 会社セクション */}
          <div className="col-span-1">
            <h3 className={`text-sm font-semibold ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            } uppercase tracking-wider mb-4`}>連絡先</h3>
            <ul className="space-y-3">
              <li>
                <Link href="https://github.com/ZundamonnoVRChatkaisetu" 
                      target="_blank"
                      className={`${
                        theme === 'dark' 
                          ? 'text-gray-400 hover:text-gray-200' 
                          : 'text-gray-600 hover:text-gray-900'
                      } text-sm`}>
                  GitHubプロフィール
                </Link>
              </li>
              <li>
                <Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows/issues" 
                      target="_blank"
                      className={`${
                        theme === 'dark' 
                          ? 'text-gray-400 hover:text-gray-200' 
                          : 'text-gray-600 hover:text-gray-900'
                      } text-sm`}>
                  バグ報告
                </Link>
              </li>
              <li>
                <Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows/pulls" 
                      target="_blank"
                      className={`${
                        theme === 'dark' 
                          ? 'text-gray-400 hover:text-gray-200' 
                          : 'text-gray-600 hover:text-gray-900'
                      } text-sm`}>
                  プルリクエスト
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* コピーライトセクション */}
        <div className={`mt-8 pt-6 border-t ${
          theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        } text-center text-sm ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
        }`}>
          <p>© {new Date().getFullYear()} Second Me Windows. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
