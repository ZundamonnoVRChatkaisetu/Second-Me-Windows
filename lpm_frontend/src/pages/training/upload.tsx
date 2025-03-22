import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { uploadTrainingData } from '../../lib/api-client';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { Progress } from '../../components/ui/Progress';
import { UploadCloud, FileSymlink, ArrowLeft } from 'lucide-react';

const UploadPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [category, setCategory] = useState('general');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const categoryOptions = [
    { value: 'general', label: '一般' },
    { value: 'personal', label: '個人情報' },
    { value: 'interests', label: '趣味・興味' },
    { value: 'knowledge', label: '知識・学習' },
    { value: 'professional', label: '専門・職業' },
    { value: 'social', label: '社会関係' },
    { value: 'custom', label: 'カスタム...' }
  ];
  
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  
  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleCategoryChange = (value) => {
    setCategory(value);
    setShowCustomCategory(value === 'custom');
  };
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'ファイルを選択してください',
        description: 'アップロードするファイルが選択されていません。',
        variant: 'destructive',
      });
      return;
    }
    
    const actualCategory = category === 'custom' ? customCategory : category;
    
    if (category === 'custom' && !customCategory.trim()) {
      toast({
        title: 'カテゴリを入力してください',
        description: 'カスタムカテゴリを入力してください。',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      await uploadTrainingData(
        selectedFiles,
        actualCategory,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      );
      
      toast({
        title: 'アップロード完了',
        description: `${selectedFiles.length}個のファイルが正常にアップロードされました。`,
      });
      
      // アップロード成功後、トレーニングデータ一覧ページに遷移
      setTimeout(() => {
        router.push('/training');
      }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'アップロード失敗',
        description: 'ファイルのアップロード中にエラーが発生しました。再度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/training">
              <ArrowLeft className="h-4 w-4 mr-1" />
              戻る
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">トレーニングデータのアップロード</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>トレーニングデータの追加</CardTitle>
            <CardDescription>
              トレーニングに使用するテキストファイル（.txt, .csv, .json）やPDFファイル（.pdf）をアップロードできます。
              複数のファイルを同時にアップロードすることもできます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ドラッグ&ドロップエリア */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.csv,.json,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <UploadCloud className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-2 text-lg font-semibold">
                ファイルをドラッグ&ドロップするか、クリックして選択
              </p>
              <p className="text-sm text-gray-500">
                サポートされる形式: .txt, .csv, .json, .pdf
              </p>
              <p className="text-sm text-gray-500 mt-1">
                最大ファイルサイズ: 10MB
              </p>
            </div>
            
            {/* 選択されたファイル一覧 */}
            {selectedFiles.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">選択されたファイル ({selectedFiles.length})</h3>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <FileSymlink className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="truncate">{file.name}</span>
                      <span className="ml-2 text-gray-500 text-xs">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* カテゴリ選択 */}
            <div className="space-y-2">
              <Label htmlFor="category">カテゴリ</Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full" id="category">
                  <SelectValue placeholder="カテゴリを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>カテゴリ</SelectLabel>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            {/* カスタムカテゴリ入力 */}
            {showCustomCategory && (
              <div className="space-y-2">
                <Label htmlFor="customCategory">カスタムカテゴリ名</Label>
                <Input
                  id="customCategory"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="カスタムカテゴリ名を入力"
                />
              </div>
            )}
            
            {/* アップロード進捗バー */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>アップロード中...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href="/training">キャンセル</Link>
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0}>
              {isUploading ? 'アップロード中...' : 'アップロード'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default UploadPage;
