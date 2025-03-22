import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { uploadTrainingData, getTrainingData } from '../../lib/api-client';

const TrainingDataUploadPage: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<string>('general');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>(['general']);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // カテゴリ一覧を取得
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getTrainingData();
        if (response.categories && response.categories.length > 0) {
          setCategories(['general', ...response.categories]);
        }
      } catch (err) {
        console.error('カテゴリ一覧の取得に失敗しました', err);
      }
    };
    fetchCategories();
  }, []);

  // ファイル選択時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);
      setError(null);
    }
  };

  // ドラッグ&ドロップ関連の処理
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileArray = Array.from(e.dataTransfer.files);
      setFiles(fileArray);
      setError(null);
    }
  };

  // アップロード処理
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('ファイルを選択してください');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const effectiveCategory = category === 'custom' ? customCategory : category;
    if (category === 'custom' && !customCategory.trim()) {
      setError('カスタムカテゴリ名を入力してください');
      setLoading(false);
      return;
    }

    try {
      const response = await uploadTrainingData(files, effectiveCategory, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        setProgress(percentCompleted);
      });

      setSuccessMessage(`${files.length}個のファイルが正常にアップロードされました`);
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setLoading(false);
    } catch (err) {
      console.error('アップロードに失敗しました', err);
      setError('ファイルのアップロードに失敗しました。ネットワーク接続を確認してください。');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>トレーニングデータのアップロード - Second Me</title>
      </Head>

      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">トレーニングデータのアップロード</h1>
          <button
            onClick={() => router.push('/training')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            戻る
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{successMessage}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="custom">カスタム...</option>
            </select>
          </div>

          {category === 'custom' && (
            <div className="mb-4">
              <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700 mb-1">
                カスタムカテゴリ名
              </label>
              <input
                type="text"
                id="customCategory"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="カテゴリ名を入力..."
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
              />
            </div>
          )}

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:bg-gray-50 mb-4"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            {files.length > 0 ? (
              <div>
                <p className="text-lg font-semibold mb-2">{files.length} ファイルが選択されています</p>
                <ul className="text-left max-h-40 overflow-y-auto">
                  {files.map((file, index) => (
                    <li key={index} className="truncate">
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  クリックしてファイルを選択 または ドラッグ&ドロップ
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  TXT, CSV, JSON, DOC, PDFなどのトレーニングデータファイル
                </p>
              </div>
            )}
          </div>

          {loading && (
            <div className="mb-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      アップロード中
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {progress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleUpload}
              disabled={loading || files.length === 0}
              className={`w-full bg-blue-600 text-white px-4 py-2 rounded ${
                loading || files.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700'
              }`}
            >
              {loading ? 'アップロード中...' : 'アップロード'}
            </button>
            <button
              onClick={() => {
                setFiles([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={loading || files.length === 0}
              className={`w-1/3 bg-gray-500 text-white px-4 py-2 rounded ${
                loading || files.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-600'
              }`}
            >
              クリア
            </button>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">アップロードのヒント</h2>
          <div className="bg-blue-50 p-4 rounded-md">
            <ul className="list-disc list-inside space-y-2">
              <li>複数のファイルを一度にアップロードできます。</li>
              <li>カテゴリを使うと、後でトレーニングデータを整理・フィルタリングしやすくなります。</li>
              <li>テキストファイルの場合、UTF-8エンコーディングを推奨します。</li>
              <li>大きなファイルは分割することで、トレーニングの柔軟性が向上します。</li>
              <li>アップロードしたデータは、トレーニング実行ページから利用できます。</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TrainingDataUploadPage;
