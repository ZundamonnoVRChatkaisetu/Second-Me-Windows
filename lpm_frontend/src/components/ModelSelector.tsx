import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LocalModel {
  name: string;
  path: string;
  rel_path: string;
  size: number;
  size_bytes: number;
  modified_at: string;
  selected: boolean;
}

/**
 * `/models`ディレクトリからモデル一覧を取得し、選択可能なUIを提供するコンポーネント
 * 依存関係を最小限に保つために基本的なHTML要素のみを使用
 */
const ModelSelector: React.FC = () => {
  const [models, setModels] = useState<LocalModel[]>([]);
  const [selectedModelPath, setSelectedModelPath] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);

  // コンポーネント初期化時にモデル一覧を取得
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/models');
        const modelsList = response.data.models || [];
        setModels(modelsList);
        
        // すでに選択されているモデルがあればそれを選択
        const selectedModel = modelsList.find(m => m.selected);
        if (selectedModel) {
          setSelectedModelPath(selectedModel.path);
        }
        // デフォルトでモデルが存在すれば最初のものを選択
        else if (modelsList.length > 0) {
          setSelectedModelPath(modelsList[0].path);
        }
      } catch (err: any) {
        console.error('Failed to fetch local models:', err);
        setError('モデルの取得に失敗しました。サーバーが起動していることを確認してください。');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // 選択したモデルを適用する
  const applySelectedModel = async () => {
    if (!selectedModelPath) return;
    
    try {
      setApplying(true);
      setError(null);
      setSuccess(false);
      
      // エンドポイントを /api/models/select に変更（バックエンドと一致させる）
      await axios.post('/api/models/select', { model_path: selectedModelPath });
      
      // 選択状態を更新
      setModels(prevModels => prevModels.map(model => ({
        ...model,
        selected: model.path === selectedModelPath
      })));
      
      setSuccess(true);
      // 3秒後に成功メッセージを非表示
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to apply model:', err);
      setError('モデルの適用に失敗しました。サーバーの状態を確認してください。');
    } finally {
      setApplying(false);
    }
  };

  // モデルサイズを適切な単位で表示する関数
  const formatSize = (gigabytes: number | undefined): string => {
    if (gigabytes === undefined || gigabytes === null) {
      return "サイズ不明";
    }
    return `${gigabytes.toFixed(2)} GB`;
  };
  
  // 選択肢の変更ハンドラ
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModelPath(e.target.value);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium mb-4">モデル選択</h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
          <span>モデル一覧を取得中...</span>
        </div>
      ) : error ? (
        <div className="p-3 bg-red-100 border border-red-300 rounded-md mb-4 text-red-700">
          <span className="mr-2">⚠️</span>
          <span>{error}</span>
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p>利用可能なモデルがありません。</p>
          <p className="mt-2">
            <code>/models</code>ディレクトリにモデルファイル（.gguf, .ggml, .bin, .pt形式）を配置してください。
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            <div>
              <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">
                利用可能なモデル
              </label>
              <select
                id="model-select"
                value={selectedModelPath}
                onChange={handleSelectChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="" disabled>モデルを選択</option>
                {models.map((model) => (
                  <option key={model.path} value={model.path}>
                    {model.name} ({formatSize(model.size)})
                    {model.selected ? ' [現在使用中]' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={applySelectedModel}
              disabled={!selectedModelPath || applying}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  適用中...
                </>
              ) : (
                '選択したモデルを適用'
              )}
            </button>
            
            {success && (
              <div className="flex items-center text-green-600">
                <span className="mr-2">✓</span>
                モデルが正常に適用されました！
              </div>
            )}
          </div>
          
          {/* 選択されたモデルの詳細情報 */}
          {selectedModelPath && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">選択されたモデル情報</h4>
              
              {(() => {
                const model = models.find(m => m.path === selectedModelPath);
                if (!model) return <p className="text-sm text-gray-600">モデル情報を取得できません</p>;
                
                return (
                  <>
                    <p className="text-sm text-gray-600">
                      ファイル名: {model.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      サイズ: {formatSize(model.size)}
                    </p>
                    <p className="text-sm text-gray-600">
                      パス: {model.rel_path}
                    </p>
                    <p className="text-sm text-gray-600">
                      更新日時: {new Date(model.modified_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      ステータス: {model.selected ? '使用中' : '未選択'}
                    </p>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModelSelector;
