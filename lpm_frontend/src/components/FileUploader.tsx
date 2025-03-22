import React, { useState, useRef, useCallback } from 'react';
import { uploadFile } from '@/lib/api-client';

interface FileUploaderProps {
  onUploadComplete?: (fileName: string, fileType: string) => void;
  onUploadError?: (error: string) => void;
  fileTypes?: string[];
  maxSizeMB?: number;
  category?: string;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  fileTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv', 'application/json'],
  maxSizeMB = 10,
  category = 'memories',
  className = '',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setSuccess(false);
    
    if (!selectedFile) {
      return;
    }
    
    // ファイルタイプの検証
    if (fileTypes.length > 0 && !fileTypes.includes(selectedFile.type)) {
      const readableFileTypes = fileTypes.map(type => {
        return type.replace('application/', '').replace('text/', '');
      }).join(', ');
      
      const errorMsg = `サポートされていないファイル形式です。${readableFileTypes}のみ許可されています。`;
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }
    
    // ファイルサイズの検証
    if (selectedFile.size > maxSizeBytes) {
      const errorMsg = `ファイルサイズが大きすぎます。最大${maxSizeMB}MBまで許可されています。`;
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }
    
    setFile(selectedFile);
  };
  
  const resetUpload = () => {
    setFile(null);
    setProgress(0);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // プログレス更新関数
      const onProgressUpdate = (progressEvent: any) => {
        const progressPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(progressPercent);
      };
      
      // ファイルをアップロード
      const response = await uploadFile(file, category, onProgressUpdate);
      
      // アップロード完了
      setSuccess(true);
      setIsUploading(false);
      setProgress(100);
      
      if (onUploadComplete) {
        onUploadComplete(file.name, file.type);
      }
      
      // 3秒後にリセット
      setTimeout(() => {
        resetUpload();
      }, 3000);
    } catch (err) {
      setIsUploading(false);
      const errorMsg = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
    }
  };
  
  const openFileSelector = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={openFileSelector}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={fileTypes.join(',')}
        />
        
        {!file ? (
          <div className="space-y-3">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600">
              クリックして<span className="font-medium text-blue-600">ファイルを選択</span>するか、ドラッグ&ドロップしてください
            </p>
            <p className="text-xs text-gray-500">
              {fileTypes.map(type => type.replace('application/', '').replace('text/', '')).join(', ')} - 最大 {maxSizeMB}MB
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <svg className="mx-auto h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <p>{error}</p>
          <button 
            onClick={resetUpload} 
            className="mt-2 text-xs font-medium text-red-600 hover:text-red-900"
          >
            リセット
          </button>
        </div>
      )}
      
      {file && !error && !success && (
        <div className="mt-3">
          {isUploading ? (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">{progress}% アップロード中...</p>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <button 
                onClick={resetUpload} 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                キャンセル
              </button>
              <button 
                onClick={handleUpload} 
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                アップロード
              </button>
            </div>
          )}
        </div>
      )}
      
      {success && (
        <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center justify-between">
          <p>ファイルが正常にアップロードされました</p>
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};
