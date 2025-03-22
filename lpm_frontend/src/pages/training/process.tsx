import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getTrainingData, startTrainingProcess } from '../../lib/api-client';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Slider } from '../../components/ui/Slider';
import { Checkbox } from '../../components/ui/Checkbox';
import { ArrowLeft, Play, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';
import { useToast } from '../../hooks/useToast';

const TrainingProcessPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [trainingData, setTrainingData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // トレーニングパラメータ
  const [learningRate, setLearningRate] = useState(0.0002);
  const [epochs, setEpochs] = useState(3);
  const [batchSize, setBatchSize] = useState(4);
  const [modelPath, setModelPath] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  // モデル選択肢（これは実際の環境に合わせて調整する必要がある）
  const modelOptions = [
    { value: '', label: '自動選択（推奨）' },
    { value: 'models/Qwen2.5-1.8B-q4', label: 'Qwen2.5 1.8B (最小・高速)' },
    { value: 'models/Qwen2.5-7B-q4', label: 'Qwen2.5 7B (バランス)' },
    { value: 'models/Qwen2.5-14B-q4', label: 'Qwen2.5 14B (高性能)' },
  ];
  
  useEffect(() => {
    fetchTrainingData();
  }, []);
  
  const fetchTrainingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTrainingData();
      
      setTrainingData(data.items || []);
      
      // カテゴリの一覧を取得（重複を排除）
      const uniqueCategories = Array.from(
        new Set(data.items.map(item => item.category).filter(Boolean))
      );
      
      setCategories(uniqueCategories);
      
      // デフォルトで全カテゴリを選択
      if (uniqueCategories.length > 0) {
        setSelectedCategories(uniqueCategories);
      }
    } catch (err) {
      console.error('Failed to fetch training data:', err);
      setError('トレーニングデータの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const handleStartTraining = async () => {
    // トレーニングデータがない場合
    if (trainingData.length === 0) {
      toast({
        title: 'トレーニングデータがありません',
        description: 'トレーニングを開始するには、まずデータをアップロードしてください。',
        variant: 'destructive',
      });
      return;
    }
    
    // カテゴリが選択されていない場合
    if (selectedCategories.length === 0) {
      toast({
        title: '少なくとも1つのカテゴリを選択してください',
        description: 'トレーニングを行うカテゴリを選択してください。',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const params = {
        model_path: modelPath || undefined,
        learning_rate: learningRate,
        epochs: epochs,
        batch_size: batchSize,
        categories: selectedCategories,
      };
      
      const result = await startTrainingProcess(params);
      
      toast({
        title: 'トレーニングプロセスを開始しました',
        description: `トレーニングID: ${result.training_id}`,
      });
      
      // トレーニングステータス画面にリダイレクト
      router.push(`/training/status/${result.training_id}`);
    } catch (err) {
      console.error('Failed to start training process:', err);
      toast({
        title: 'トレーニングプロセスの開始に失敗しました',
        description: '設定を確認して再度お試しください。',
        variant: 'destructive',
      });
      setIsProcessing(false);
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
          <h1 className="text-3xl font-bold">トレーニングプロセス設定</h1>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>モデル・パラメータ設定</CardTitle>
              <CardDescription>
                トレーニングに使用するモデルとハイパーパラメータを設定します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* モデル選択 */}
              <div className="space-y-2">
                <Label htmlFor="model">ベースモデル</Label>
                <Select value={modelPath} onValueChange={setModelPath}>
                  <SelectTrigger id="model">
                    <SelectValue placeholder="モデルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  自動選択の場合は、利用可能なモデルから最適なものが選ばれます。
                </p>
              </div>
              
              {/* 学習率 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="learning-rate">学習率</Label>
                  <span className="text-sm font-medium">{learningRate}</span>
                </div>
                <Slider
                  id="learning-rate"
                  min={0.0001}
                  max={0.001}
                  step={0.0001}
                  value={[learningRate]}
                  onValueChange={(value) => setLearningRate(value[0])}
                />
                <p className="text-sm text-gray-500">
                  小さな値ほど学習は慎重に行われますが、時間がかかります。
                </p>
              </div>
              
              {/* エポック数 */}
              <div className="space-y-2">
                <Label htmlFor="epochs">エポック数</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="epochs"
                    type="number"
                    min={1}
                    max={10}
                    value={epochs}
                    onChange={(e) => setEpochs(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">回</span>
                </div>
                <p className="text-sm text-gray-500">
                  全データを何周学習するかを指定します。多いほど時間がかかります。
                </p>
              </div>
              
              {/* バッチサイズ */}
              <div className="space-y-2">
                <Label htmlFor="batch-size">バッチサイズ</Label>
                <Select
                  value={batchSize.toString()}
                  onValueChange={(value) => setBatchSize(parseInt(value))}
                >
                  <SelectTrigger id="batch-size">
                    <SelectValue placeholder="バッチサイズを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1（低メモリ・低速）</SelectItem>
                    <SelectItem value="2">2（省メモリ）</SelectItem>
                    <SelectItem value="4">4（バランス・推奨）</SelectItem>
                    <SelectItem value="8">8（高速・高メモリ）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  一度に処理するデータの数です。大きいほど速いですがメモリを消費します。
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>対象データ設定</CardTitle>
              <CardDescription>
                トレーニングに使用するデータのカテゴリを選択します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : trainingData.length === 0 ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>トレーニングデータがありません</AlertTitle>
                  <AlertDescription>
                    トレーニングを行うには、まずデータをアップロードしてください。
                    <Button asChild variant="link" className="px-0 mt-2">
                      <Link href="/training/upload">データアップロードページへ</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>対象カテゴリ</Label>
                    {categories.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        カテゴリが設定されたデータがありません。
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category}`}
                              checked={selectedCategories.includes(category)}
                              onCheckedChange={() => handleCategoryToggle(category)}
                            />
                            <Label
                              htmlFor={`category-${category}`}
                              className="cursor-pointer"
                            >
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded p-4 bg-gray-50">
                    <h3 className="font-medium mb-2">選択中のデータ情報</h3>
                    <p className="text-sm">
                      ファイル数:{' '}
                      {trainingData.filter(item => 
                        selectedCategories.includes(item.category)
                      ).length}{' '}個
                    </p>
                    <p className="text-sm">
                      合計サイズ:{' '}
                      {(trainingData
                        .filter(item => selectedCategories.includes(item.category))
                        .reduce((sum, item) => sum + item.size, 0) / 1024
                      ).toFixed(2)}{' '}KB
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/training">キャンセル</Link>
              </Button>
              <Button 
                onClick={handleStartTraining} 
                disabled={isProcessing || selectedCategories.length === 0 || trainingData.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                {isProcessing ? 'トレーニング開始中...' : 'トレーニングを開始'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TrainingProcessPage;
