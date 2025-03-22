import React, { useState, useEffect } from 'react';

interface BasicInfoStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

/**
 * 第2の自分の基本情報入力ステップ
 * マルチステップウィザードの最初のステップ
 */
const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ formData, updateFormData }) => {
  const [name, setName] = useState(formData.name || '');
  const [description, setDescription] = useState(formData.description || '');
  const [purpose, setPurpose] = useState(formData.purpose || '');

  // 値が変更されたらフォームデータを更新
  useEffect(() => {
    updateFormData({ name, description, purpose });
  }, [name, description, purpose, updateFormData]);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 text-blue-800 rounded-md">
        <h2 className="font-medium text-lg mb-2">第2の自分を作成</h2>
        <p className="mb-2">
          まずは、あなたの第2の自分に名前をつけ、その特徴や目的を定義しましょう。
          これはあなた自身のAI表現となり、あなたの思考や知識を反映します。
        </p>
      </div>

      {/* 名前 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          第2の自分の名前 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="あなたの第2の自分の名前"
          required
        />
        <p className="text-xs text-gray-500 mt-1">例：「仕事用アシスタント」「英語学習サポーター」「創作パートナー」など</p>
      </div>

      {/* 目的 */}
      <div>
        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
          目的 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="この第2の自分の主な目的"
          required
        />
        <p className="text-xs text-gray-500 mt-1">例：「ビジネス文書作成」「プログラミング学習」「創作アイデア発想」など</p>
      </div>

      {/* 説明 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          詳細な説明
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="この第2の自分の特徴や能力、得意分野などを詳しく書いてみましょう"
        ></textarea>
        <p className="text-xs text-gray-500 mt-1">
          どのような場面で役立つか、どのような性格や特性を持つかなど、詳細に記述するとより特徴的な第2の自分が作れます
        </p>
      </div>
    </div>
  );
};

// バリデーション関数
export const validateBasicInfo = (formData: any): boolean => {
  if (!formData.name || formData.name.trim() === '') {
    throw new Error('第2の自分の名前を入力してください');
  }
  
  if (!formData.purpose || formData.purpose.trim() === '') {
    throw new Error('目的を入力してください');
  }
  
  return true;
};

export default BasicInfoStep;
