import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CompleteStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

/**
 * 完了ステップ
 * マルチステップウィザードの最後のステップ
 */
const CompleteStep: React.FC<CompleteStepProps> = ({ formData, updateFormData }) => {
  const [redirectToChat, setRedirectToChat] = useState(formData.redirectToChat !== false);

  // 値が変更されたらフォームデータを更新
  useEffect(() => {
    updateFormData({ redirectToChat });
  }, [redirectToChat, updateFormData]);

  // 専門分野を整形
  const formatExpertise = (expertise: string[] = []) => {
    if (!expertise || expertise.length === 0) return '選択なし';
    return expertise.join('、');
  };

  // 口調の表示名を取得
  const getToneName = (toneId: string) => {
    const tones = {
      'formal': '丁寧・フォーマル',
      'casual': 'カジュアル・友達口調',
      'neutral': '中立的・バランス型',
      'enthusiastic': '熱意のある・積極的',
      'professional': 'プロフェッショナル・専門的',
      'humorous': 'ユーモアのある・明るい'
    };
    return tones[toneId as keyof typeof tones] || toneId;
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 text-green-800 rounded-md">
        <h2 className="font-medium text-lg mb-2">第2の自分の設定完了</h2>
        <p className="mb-2">
          おめでとうございます！第2の自分の設定がほぼ完了しました。
          以下の情報を確認し、問題なければ「作成する」ボタンをクリックしてください。
        </p>
      </div>

      {/* プロファイル情報の要約 */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="font-medium text-lg mb-3">第2の自分の概要</h3>
        
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700">名前</h4>
            <p>{formData.name || '未設定'}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700">目的</h4>
            <p>{formData.purpose || '未設定'}</p>
          </div>
          
          {formData.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">詳細説明</h4>
              <p className="text-sm text-gray-600">{formData.description}</p>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-gray-700">ベースモデル</h4>
            <p>{formData.selectedModelPath || '未選択'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Temperature</h4>
              <p>{formData.temperature || '0.7'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">最大トークン数</h4>
              <p>{formData.maxLength || '2048'}</p>
            </div>
          </div>
          
          {formData.personality && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">パーソナリティ</h4>
              <p className="text-sm text-gray-600">{formData.personality}</p>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-gray-700">口調</h4>
            <p>{getToneName(formData.tone || 'neutral')}</p>
          </div>
          
          {formData.expertise && formData.expertise.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">専門分野</h4>
              <p>{formatExpertise(formData.expertise)}</p>
            </div>
          )}
        </div>
      </div>

      {/* 次のステップの案内 */}
      <div className="p-4 bg-blue-50 text-blue-800 rounded-md">
        <h3 className="font-medium mb-2">次のステップ</h3>
        <p className="mb-2">
          第2の自分を作成した後、以下のステップでさらにパーソナライズできます：
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>メモリーデータのアップロード（テキスト、文書、チャット履歴など）</li>
          <li>トレーニングデータで第2の自分をカスタマイズ</li>
          <li>第2の自分とのチャットを通じて対話スタイルを調整</li>
        </ul>
      </div>

      {/* リダイレクト先オプション */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="redirect-option"
          checked={redirectToChat}
          onChange={(e) => setRedirectToChat(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="redirect-option" className="text-sm text-gray-700">
          作成後、すぐにチャットを開始する
        </label>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>※ 第2の自分の設定は後からいつでも変更できます。</p>
      </div>
    </div>
  );
};

// バリデーション関数
export const validateComplete = (formData: any): boolean => {
  // 最終確認ステップなので常にtrue
  return true;
};

export default CompleteStep;
