import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';
import { importMemories } from '../../lib/api-client';

/**
 * メモリー一括アップロードページ
 */
export default function BatchUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);
  const [importType, setImportType] = useState<'text' | 'csv' | 'json'>('text');
  const [customText, setCustomText] = useState<string>('');

  // ファイル選択ハンドラー
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setUploadResult(null);
    }
  };

  // ファイルアップロードボタンクリックハンドラー
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // ファイルのアップロード処理
  const handleUpload = async () => {
    if (!selectedFile && importType !== 'text') {
      setUploadResult({
        success: false,
        message: 'ファイルが選択されていません。',
      });
      return;
    }

    if (importType === 'text' && !customText.trim()) {
      setUploadResult({
        success: false,
        message: 'テキストが入力されていません。',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      let result;
      
      if (importType === 'text') {
        // テキストからファイルを作成
        const blob = new Blob([customText], { type: 'text/plain' });
        const file = new File([blob], 'memories.txt', { type: 'text/plain' });
        result = await importMemories(file);
      } else if (selectedFile) {
        // ファイルをアップロード
        result = await importMemories(selectedFile);
      } else {
        throw new Error('ファイルまたはテキストが必要です。');
      }

      setUploadResult({
        success: true,
        message: `${result.imported_count}件のメモリーをインポートしました。`,
        count: result.imported_count,
      });
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadResult({
        success: false,
        message: `アップロードに失敗しました: ${err.message || 'エラーが発生しました。'}`,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  // 完了して一覧に戻る
  const handleComplete = () => {
    router.push('/memory');
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* ヘッダー */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">メモリー一括インポート</h1>
                <Link href="/memory">
                  <Button variant="outline">
                    一覧に戻る
                  </Button>
                </Link>
              </div>
              
              <p className="text-gray-600 mb-4">
                複数のメモリーを一度にインポートできます。
                テキスト入力、CSVファイル、またはJSONファイルの形式でインポートが可能です。
              </p>
            </div>
            
            {/* インポート方法選択 */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">インポート方法を選択</h2>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={() => setImportType('text')}
                  className={`px-4 py-2 rounded-lg border ${
                    importType === 'text' 
                      ? 'bg-blue-100 border-blue-500 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  テキスト入力
                </button>
                <button
                  onClick={() => setImportType('csv')}
                  className={`px-4 py-2 rounded-lg border ${
                    importType === 'csv' 
                      ? 'bg-blue-100 border-blue-500 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  CSVファイル
                </button>
                <button
                  onClick={() => setImportType('json')}
                  className={`px-4 py-2 rounded-lg border ${
                    importType === 'json' 
                      ? 'bg-blue-100 border-blue-500 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  JSONファイル
                </button>
              </div>
              
              {/* インポート形式の説明 */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">
                  {importType === 'text' && 'テキスト入力形式'}
                  {importType === 'csv' && 'CSVファイル形式'}
                  {importType === 'json' && 'JSONファイル形式'}
                </h3>
                
                {importType === 'text' && (
                  <p className="text-sm text-gray-600">
                    各行が1つのメモリーとして処理されます。空の行はスキップされます。
                  </p>
                )}
                
                {importType === 'csv' && (
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">CSVファイルは以下のフォーマットに従ってください：</p>
                    <p><code>内容,カテゴリ,重要度</code></p>
                    <p className="mt-2">例：</p>
                    <pre className="bg-gray-200 p-2 rounded mt-1">
                      趣味は読書です。,個人情報,3<br/>
                      好きな食べ物はラーメンです。,好み,2<br/>
                      2023年に沖縄旅行に行きました。,旅行,4
                    </pre>
                    <p className="mt-2">カテゴリと重要度は省略可能です。重要度は1〜5の整数です。</p>
                  </div>
                )}
                
                {importType === 'json' && (
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">JSONファイルは以下のフォーマットに従ってください：</p>
                    <p>配列形式：</p>
                    <pre className="bg-gray-200 p-2 rounded mt-1">
                      [<br/>
                      {"  {\"content\": \"メモリー内容\", \"category\": \"カテゴリ\", \"importance\": 3},"}
                      <br/>
                      {"  {\"content\": \"別のメモリー\", \"category\": \"別カテゴリ\", \"importance\": 2}"}
                      <br/>
                      ]
                    </pre>
                    <p className="mt-2">category と importance は省略可能です。importance は1〜5の整数です。</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* ファイルアップロードまたはテキスト入力 */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              {importType === 'text' ? (
                <div>
                  <h2 className="text-lg font-semibold mb-4">テキスト入力</h2>
                  <p className="text-sm text-gray-600 mb-2">
                    各行が1つのメモリーとして処理されます。
                  </p>
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="ここにメモリーを入力してください。改行で区切られた各行が1つのメモリーとして登録されます。"
                    className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    {importType === 'csv' ? 'CSVファイルのアップロード' : 'JSONファイルのアップロード'}
                  </h2>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={importType === 'csv' ? '.csv' : '.json'}
                    className="hidden"
                  />
                  
                  <div
                    onClick={handleSelectFileClick}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {selectedFile ? (
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                        <p className="text-sm text-blue-500 mt-2">
                          クリックして別のファイルを選択
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium text-gray-700 mb-1">
                          ファイルをドロップまたはクリックして選択
                        </p>
                        <p className="text-sm text-gray-500">
                          {importType === 'csv' ? '.csv' : '.json'} ファイルをアップロード
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* アップロードボタンと結果 */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-center mb-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || ((importType !== 'text') && !selectedFile) || (importType === 'text' && !customText.trim())}
                  className="px-8 py-2"
                >
                  {isUploading ? 'インポート中...' : 'インポート開始'}
                </Button>
              </div>
              
              {isUploading && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    処理中...
                  </p>
                </div>
              )}
              
              {uploadResult && (
                <div className={`p-4 rounded-md ${
                  uploadResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <p>{uploadResult.message}</p>
                </div>
              )}
            </div>
            
            {/* 完了ボタン */}
            {uploadResult?.success && (
              <div className="flex justify-center">
                <Button onClick={handleComplete}>
                  完了してメモリー一覧に戻る
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
