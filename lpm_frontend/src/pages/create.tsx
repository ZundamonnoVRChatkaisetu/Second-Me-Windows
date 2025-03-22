import { useState } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import Link from 'next/link';

/**
 * ステップ別の作成プロセスを管理する状態型
 */
type Step = 'identity' | 'upload' | 'train' | 'network' | 'complete';

/**
 * AIセルフ作成ページ
 */
export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState<Step>('identity');

  // 次のステップに進む
  const goToNextStep = () => {
    switch (currentStep) {
      case 'identity':
        setCurrentStep('upload');
        break;
      case 'upload':
        setCurrentStep('train');
        break;
      case 'train':
        setCurrentStep('network');
        break;
      case 'network':
        setCurrentStep('complete');
        break;
    }
  };

  // 前のステップに戻る
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'upload':
        setCurrentStep('identity');
        break;
      case 'train':
        setCurrentStep('upload');
        break;
      case 'network':
        setCurrentStep('train');
        break;
      case 'complete':
        setCurrentStep('network');
        break;
    }
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
            {/* ヘッダー */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">第二の自分を作る</h1>
              <p className="text-gray-600">
                以下のステップに従って、あなた自身のAIセルフを作成しましょう
              </p>
            </div>

            {/* 進行状況インジケーター */}
            <div className="mb-10">
              <div className="flex justify-between mb-2">
                {(['identity', 'upload', 'train', 'network', 'complete'] as Step[]).map((step, index) => (
                  <div 
                    key={step} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep === step
                        ? 'bg-blue-500 text-white'
                        : ((['identity', 'upload', 'train', 'network', 'complete'] as Step[]).indexOf(currentStep) > index)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
              <div className="relative h-2 bg-gray-200 rounded">
                <div 
                  className="absolute left-0 top-0 h-2 bg-blue-500 rounded"
                  style={{ 
                    width: `${
                      currentStep === 'identity' ? 0 :
                      currentStep === 'upload' ? 25 :
                      currentStep === 'train' ? 50 :
                      currentStep === 'network' ? 75 :
                      100
                    }%` 
                  }}
                ></div>
              </div>
            </div>

            {/* ステップコンテンツ */}
            <div className="mb-8">
              {currentStep === 'identity' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">アイデンティティを定義する</h2>
                  <p className="mb-4">まず自分のアイデンティティを定義しましょう。これはAIセルフの基盤となります。</p>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                      <input 
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="あなたの名前"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="あなた自身についての簡単な説明"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">興味・関心</label>
                      <input 
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="カンマ区切りで入力（例: 技術, 音楽, 旅行）"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'upload' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">思い出をアップロード</h2>
                  <p className="mb-4">メモ、ドキュメント、その他のコンテンツをアップロードして、あなたの体験を共有しましょう。</p>
                  
                  <div className="mb-6">
                    <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-8m-12 4h12a4 4 0 004-4v-4m-4-4l-4-4m0 0l-4 4m4-4v12"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                          >
                            <span>ファイルをアップロード</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                          </label>
                          <p className="pl-1">もしくはドラッグ＆ドロップ</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          テキスト, PDF, Word, その他のドキュメント（最大10MB）
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'train' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">第二の私を訓練する</h2>
                  <p className="mb-4">あなたのアイデンティティ、経験、好みを学習して AI モデルをトレーニングします。</p>
                  
                  <div className="mb-6">
                    <div className="bg-gray-100 p-4 rounded-md mb-4">
                      <h3 className="font-medium mb-2">トレーニングパラメータ</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">トレーニング強度</label>
                          <input 
                            type="range" 
                            min="1" 
                            max="5" 
                            className="w-full"
                            defaultValue="3"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>低</span>
                            <span>中</span>
                            <span>高</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">創造性レベル</label>
                          <input 
                            type="range" 
                            min="1" 
                            max="5" 
                            className="w-full"
                            defaultValue="3"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>低</span>
                            <span>中</span>
                            <span>高</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md">
                      <p className="text-sm text-blue-700">
                        注: トレーニングプロセスには数分かかる場合があります。トレーニング中もブラウザを開いたままにしてください。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'network' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">AIネットワークに参加する</h2>
                  <p className="mb-4">Second Me とネットワーク内の他の AI エンティティ間の相互作用を調べます。</p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-100 p-4 rounded-md">
                      <h3 className="font-medium mb-2">ネットワーク設定</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="public-mode"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="public-mode" className="ml-2 block text-sm text-gray-700">
                            パブリックモード（他のユーザーがあなたのAIとやり取りできます）
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="learning-mode"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="learning-mode" className="ml-2 block text-sm text-gray-700">
                            継続的学習モード（使用中に学習し続けます）
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="collaboration-mode"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="collaboration-mode" className="ml-2 block text-sm text-gray-700">
                            協力モード（他のAIと協力して問題解決します）
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'complete' && (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                    <svg 
                      className="w-8 h-8 text-green-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2">セットアップ完了!</h2>
                  <p className="text-gray-600 mb-6">
                    おめでとうございます！あなたの第二の自分の設定が完了しました。
                    今すぐ対話を始めましょう。
                  </p>
                  
                  <Link href="/chat">
                    <Button size="lg">
                      会話を開始
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* ナビゲーションボタン */}
            <div className="flex justify-between">
              {currentStep !== 'identity' && currentStep !== 'complete' && (
                <Button variant="outline" onClick={goToPreviousStep}>
                  戻る
                </Button>
              )}
              
              {currentStep === 'identity' && (
                <div></div>
              )}
              
              {currentStep !== 'complete' && (
                <Button onClick={goToNextStep}>
                  {currentStep === 'network' ? '完了' : '次へ'}
                </Button>
              )}
              
              {currentStep === 'complete' && (
                <div></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
