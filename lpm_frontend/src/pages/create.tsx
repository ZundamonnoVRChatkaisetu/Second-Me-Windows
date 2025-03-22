import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import Link from 'next/link';
import { FileUploader } from '@/components/FileUploader';
import { getTrainingStatus, startTraining } from '@/lib/api-client';

/**
 * ステップ別の作成プロセスを管理する状態型
 */
type Step = 'identity' | 'upload' | 'train' | 'network' | 'complete';

// アイデンティティ情報の型定義
interface IdentityData {
  name: string;
  bio: string;
  interests: string;
}

// トレーニング設定の型定義
interface TrainingOptions {
  intensity: number;
  creativity: number;
}

// ネットワーク設定の型定義
interface NetworkSettings {
  publicMode: boolean;
  learningMode: boolean;
  collaborationMode: boolean;
}

/**
 * AIセルフ作成ページ
 */
export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState<Step>('identity');
  const [identityData, setIdentityData] = useState<IdentityData>({
    name: '',
    bio: '',
    interests: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [trainingOptions, setTrainingOptions] = useState<TrainingOptions>({
    intensity: 3,
    creativity: 3
  });
  const [networkSettings, setNetworkSettings] = useState<NetworkSettings>({
    publicMode: false,
    learningMode: true,
    collaborationMode: false
  });
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingComplete, setTrainingComplete] = useState(false);

  // 次のステップに進む
  const goToNextStep = async () => {
    switch (currentStep) {
      case 'identity':
        // アイデンティティデータの検証
        if (!identityData.name || !identityData.bio) {
          alert('名前と自己紹介を入力してください');
          return;
        }
        setCurrentStep('upload');
        break;
      case 'upload':
        // ファイルのアップロードチェック
        if (uploadedFiles.length === 0) {
          const proceed = confirm('ファイルがアップロードされていません。このまま続けますか？');
          if (!proceed) return;
        }
        setCurrentStep('train');
        break;
      case 'train':
        // トレーニングを開始
        try {
          setIsTraining(true);
          const response = await startTraining({
            intensity: trainingOptions.intensity,
            creativity: trainingOptions.creativity
          });
          // ここではトレーニングの状態をポーリングする仮の実装
          // 実際のバックエンドが実装されたら、それに合わせて書き換え
          trackTrainingProgress();
        } catch (error) {
          console.error('Training failed to start', error);
          alert('トレーニングの開始に失敗しました。もう一度お試しください。');
          setIsTraining(false);
        }
        break;
      case 'network':
        setCurrentStep('complete');
        break;
    }
  };

  // トレーニングの進行状況を追跡する関数
  const trackTrainingProgress = () => {
    // ここでは仮のプログレスをシミュレート
    // 実際はバックエンドAPIからの応答を使用すべき
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setTrainingProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTrainingComplete(true);
        setIsTraining(false);
        setCurrentStep('network');
      }
    }, 1000);
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

  // アイデンティティデータの更新
  const handleIdentityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setIdentityData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // トレーニングオプションの更新
  const handleTrainingOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTrainingOptions(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };

  // ネットワーク設定の更新
  const handleNetworkSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNetworkSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // ファイルアップロード完了時のハンドラー
  const handleUploadComplete = (fileName: string, fileType: string) => {
    setUploadedFiles(prev => [...prev, fileName]);
  };

  // ファイルアップロードエラー時のハンドラー
  const handleUploadError = (error: string) => {
    console.error('File upload error:', error);
    // エラーメッセージを表示する処理をここに追加
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
                        name="name"
                        value={identityData.name}
                        onChange={handleIdentityChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="あなたの名前"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
                      <textarea
                        name="bio"
                        value={identityData.bio}
                        onChange={handleIdentityChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="あなた自身についての簡単な説明"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">興味・関心</label>
                      <input 
                        type="text"
                        name="interests"
                        value={identityData.interests}
                        onChange={handleIdentityChange}
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
                    {/* 新しいFileUploaderコンポーネントの使用 */}
                    <FileUploader 
                      onUploadComplete={handleUploadComplete}
                      onUploadError={handleUploadError}
                      fileTypes={['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv', 'application/json']}
                      maxSizeMB={10}
                      category="memories"
                    />
                    
                    {/* アップロードされたファイルのリスト */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">アップロードされたファイル:</h3>
                        <ul className="space-y-1">
                          {uploadedFiles.map((file, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 'train' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">第二の私を訓練する</h2>
                  <p className="mb-4">あなたのアイデンティティ、経験、好みを学習して AI モデルをトレーニングします。</p>
                  
                  {!isTraining ? (
                    <div className="mb-6">
                      <div className="bg-gray-100 p-4 rounded-md mb-4">
                        <h3 className="font-medium mb-2">トレーニングパラメータ</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">トレーニング強度</label>
                            <input 
                              type="range" 
                              name="intensity"
                              min="1" 
                              max="5" 
                              className="w-full"
                              value={trainingOptions.intensity}
                              onChange={handleTrainingOptionChange}
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
                              name="creativity"
                              min="1" 
                              max="5" 
                              className="w-full"
                              value={trainingOptions.creativity}
                              onChange={handleTrainingOptionChange}
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
                  ) : (
                    <div className="mb-6">
                      <div className="bg-gray-100 p-6 rounded-md text-center">
                        <h3 className="font-medium mb-4">トレーニング実行中...</h3>
                        
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-in-out" 
                              style={{ width: `${trainingProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{trainingProgress}% 完了</p>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          あなたのデータに基づいて、AI自己をトレーニングしています。
                          このプロセスには数分かかることがあります。
                        </p>
                      </div>
                    </div>
                  )}
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
                            id="publicMode"
                            name="publicMode"
                            checked={networkSettings.publicMode}
                            onChange={handleNetworkSettingChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="publicMode" className="ml-2 block text-sm text-gray-700">
                            パブリックモード（他のユーザーがあなたのAIとやり取りできます）
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="learningMode"
                            name="learningMode"
                            checked={networkSettings.learningMode}
                            onChange={handleNetworkSettingChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="learningMode" className="ml-2 block text-sm text-gray-700">
                            継続的学習モード（使用中に学習し続けます）
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="collaborationMode"
                            name="collaborationMode"
                            checked={networkSettings.collaborationMode}
                            onChange={handleNetworkSettingChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="collaborationMode" className="ml-2 block text-sm text-gray-700">
                            協力モード（他のAIと協力して問題解決します）
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <h3 className="font-medium text-yellow-800 mb-2">プライバシー情報</h3>
                      <p className="text-sm text-yellow-700">
                        パブリックモードを有効にすると、あなたのAI自己がSecond Meネットワーク上で検出可能になります。
                        ただし、アップロードされたメモリーは常にプライベートに保たれ、ローカルに保存されます。
                        いつでも設定を変更できます。
                      </p>
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
                <Button variant="outline" onClick={goToPreviousStep} disabled={isTraining}>
                  戻る
                </Button>
              )}
              
              {currentStep === 'identity' && (
                <div></div>
              )}
              
              {currentStep !== 'complete' && (
                <Button onClick={goToNextStep} disabled={isTraining && currentStep === 'train'}>
                  {currentStep === 'network' ? '完了' : (currentStep === 'train' && isTraining ? 'トレーニング中...' : '次へ')}
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
