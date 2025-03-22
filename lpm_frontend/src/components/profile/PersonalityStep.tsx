import React, { useState, useEffect } from 'react';

interface PersonalityStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

/**
 * パーソナリティ設定ステップ
 * マルチステップウィザードの3番目のステップ
 */
const PersonalityStep: React.FC<PersonalityStepProps> = ({ formData, updateFormData }) => {
  const [personality, setPersonality] = useState(formData.personality || '');
  const [tone, setTone] = useState(formData.tone || 'neutral');
  const [expertise, setExpertise] = useState<string[]>(formData.expertise || []);
  const [customPrompt, setCustomPrompt] = useState(formData.customPrompt || '');

  // 利用可能な専門分野のリスト
  const availableExpertise = [
    'プログラミング',
    'ビジネス',
    '創作・文学',
    '科学',
    '教育',
    '芸術',
    '健康・医療',
    'スポーツ',
    '金融',
    '料理・フード',
    '心理学',
    '哲学',
    '歴史',
    '言語学習',
    'エンターテイメント',
    'テクノロジー'
  ];

  // 利用可能な口調のリスト
  const availableTones = [
    { id: 'formal', name: '丁寧・フォーマル' },
    { id: 'casual', name: 'カジュアル・友達口調' },
    { id: 'neutral', name: '中立的・バランス型' },
    { id: 'enthusiastic', name: '熱意のある・積極的' },
    { id: 'professional', name: 'プロフェッショナル・専門的' },
    { id: 'humorous', name: 'ユーモアのある・明るい' }
  ];

  // 値が変更されたらフォームデータを更新
  useEffect(() => {
    updateFormData({ personality, tone, expertise, customPrompt });
  }, [personality, tone, expertise, customPrompt, updateFormData]);

  // 専門分野の選択を切り替え
  const toggleExpertise = (field: string) => {
    if (expertise.includes(field)) {
      setExpertise(expertise.filter(e => e !== field));
    } else {
      setExpertise([...expertise, field]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 text-blue-800 rounded-md">
        <h2 className="font-medium text-lg mb-2">パーソナリティ設定</h2>
        <p className="mb-2">
          第2の自分の人格や特性を設定します。これはオプション設定ですが、
          より特徴的な第2の自分を作るために役立ちます。
        </p>
      </div>

      {/* パーソナリティ説明 */}
      <div>
        <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-1">
          パーソナリティの説明
        </label>
        <textarea
          id="personality"
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="第2の自分の性格や特徴を自由に記述してください"
        ></textarea>
        <p className="text-xs text-gray-500 mt-1">
          例：「論理的で冷静、データに基づいた分析を得意とする」「明るく友好的で、初心者にも分かりやすく説明する」など
        </p>
      </div>

      {/* 口調選択 */}
      <div>
        <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
          基本的な口調
        </label>
        <select
          id="tone"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {availableTones.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          第2の自分の基本的な話し方の特徴を選択します
        </p>
      </div>

      {/* 専門分野選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          得意な専門分野（複数選択可）
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {availableExpertise.map((field) => (
            <div key={field} className="flex items-center">
              <input
                type="checkbox"
                id={`expertise-${field}`}
                checked={expertise.includes(field)}
                onChange={() => toggleExpertise(field)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
              />
              <label htmlFor={`expertise-${field}`} className="text-sm text-gray-700">
                {field}
              </label>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          この第2の自分が特に詳しい分野や得意とする領域を選択してください
        </p>
      </div>

      {/* カスタムプロンプト */}
      <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
        <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-1">
          カスタムプロンプト（上級者向け）
        </label>
        <textarea
          id="customPrompt"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="AIモデルに与える詳細な指示を記述できます"
        ></textarea>
        <p className="text-xs text-gray-500 mt-1">
          上記の設定より細かく第2の自分の振る舞いを制御したい場合に、直接AIモデルへの指示を記述できます。
          空欄の場合は自動的に適切なプロンプトが生成されます。
        </p>
      </div>
    </div>
  );
};

// バリデーション関数
export const validatePersonality = (formData: any): boolean => {
  // パーソナリティ設定はオプションなので常にtrue
  return true;
};

export default PersonalityStep;
