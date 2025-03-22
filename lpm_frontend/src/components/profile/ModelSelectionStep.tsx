import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Model {
  name: string;
  path: string;
  size: number;
  selected: boolean;
}

interface ModelSelectionStepProps {
  formData: any;
  updateFormData: (data: any) => void;
}

/**
 * モデル選択ステップ
 * マルチステップウィザードの2番目のステップ
 */
const ModelSelectionStep: React.FC<ModelSelectionStepProps> = ({ formData, updateFormData }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelPath, setSelectedModelPath] = useState(formData.selectedModelPath || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState(formData.temperature || 0.7);
  const [maxLength, setMaxLength] = useState(formData.maxLength || 2048);

  // モデル一覧を取得
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/models');
        const modelList = response.data.models || [];
        
        setModels(modelList);
        
        // 既にモデルが選択されていない場合は、最初のモデルを選択
        if (!selectedModelPath && modelList.length > 0) {
          setSelectedModelPath(modelList[0].path);
          updateFormData({ selectedModelPath: modelList[0].path });
        }
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setError('モデル一覧の取得に失敗しました。サーバーの状態を確認してください。');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // 値が変更されたらフォームデータを更新
  useEffect(() => {
    updateFormData({ selectedModelPath, temperature, maxLength });
  }, [selectedModelPath, temperature, maxLength, updateFormData]);

  // モデルサイズを適切な単位で表示する関数
  const formatSize = (gigabytes: number): string => {
    return `${gigabytes.toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 text-blue-800 rounded-md">
        <h2 className="font-medium text-lg mb-2">AIモデルの選択</h2>
        <p className="mb-2">
          第2の自分の基盤となるAIモデルと、その動作設定を選択します。
          モデルの性能やサイズによって、応答の品質や処理速度が変わります。
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {/* モデル選択 */}
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
          ベースモデル <span className="text-red-500">*</span>
        </label>
        {loading ? (
          <div className="p-3 bg-gray-50 text-gray-500 rounded-md">モデル一覧を読み込み中...</div>
        ) : models.length === 0 ? (
          <div className="p-3 bg-yellow-50 text-yellow-700 rounded-md">
            <p>利用可能なモデルがありません。<a href="/settings" className="text-blue-600 underline">設定ページ</a>でモデルを選択または追加してください。</p>
          </div>
        ) : (
          <select
            id="model"
            value={selectedModelPath}
            onChange={(e) => setSelectedModelPath(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {models.map((model) => (
              <option key={model.path} value={model.path}>
                {model.name} ({formatSize(model.size)})
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-gray-500 mt-1">
          より大きなモデルほど高品質な応答が得られますが、実行に必要なメモリと処理時間も増加します
        </p>
      </div>

      {/* Temperature設定 */}
      <div>
        <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
          Temperature: {temperature}
        </label>
        <input
          id="temperature"
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>より決定論的 (0.1)</span>
          <span>よりランダム (2.0)</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          低い値では一貫性のある応答に、高い値では創造的でバラエティに富んだ応答になります
        </p>
      </div>

      {/* 最大出力長設定 */}
      <div>
        <label htmlFor="maxLength" className="block text-sm font-medium text-gray-700 mb-1">
          最大出力トークン数: {maxLength}
        </label>
        <input
          id="maxLength"
          type="range"
          min="256"
          max="4096"
          step="256"
          value={maxLength}
          onChange={(e) => setMaxLength(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>短い応答 (256)</span>
          <span>長い応答 (4096)</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          応答の最大長を設定します。長い値を設定すると詳細な応答が得られますが、処理時間も長くなります
        </p>
      </div>

      {/* 現在選択中のモデル情報 */}
      {selectedModelPath && (
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="font-medium text-sm mb-2">選択中のモデル:</h3>
          <p className="text-sm">
            {models.find(m => m.path === selectedModelPath)?.name || selectedModelPath}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            パス: {selectedModelPath}
          </p>
        </div>
      )}
    </div>
  );
};

// バリデーション関数
export const validateModelSelection = (formData: any): boolean => {
  if (!formData.selectedModelPath) {
    throw new Error('モデルを選択してください');
  }
  
  return true;
};

export default ModelSelectionStep;
