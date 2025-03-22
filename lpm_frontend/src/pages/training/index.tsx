import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getTrainingData, deleteTrainingData } from '../../lib/api-client';
import Layout from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/AlertDialog';
import { Trash2, Plus, FileEdit, Play } from 'lucide-react';

const TrainingPage = () => {
  const router = useRouter();
  const [trainingData, setTrainingData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrainingData();
  }, [selectedCategory]);

  const fetchTrainingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await getTrainingData(category);
      
      setTrainingData(data.items || []);
      
      // カテゴリの一覧を取得（重複を排除）
      const uniqueCategories = Array.from(
        new Set(data.items.map(item => item.category))
      ).filter(Boolean);
      
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Failed to fetch training data:', err);
      setError('トレーニングデータの取得に失敗しました。再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteData = async (dataId, path) => {
    try {
      await deleteTrainingData(dataId, path);
      // 削除後にデータを再取得
      fetchTrainingData();
    } catch (err) {
      console.error('Failed to delete training data:', err);
      setError('トレーニングデータの削除に失敗しました。再度お試しください。');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">トレーニングデータ管理</h1>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/training/upload">
                <Plus className="mr-2 h-4 w-4" />
                データ追加
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/training/process">
                <Play className="mr-2 h-4 w-4" />
                トレーニング実行
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>トレーニングデータ一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="all" 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
              className="mt-2"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all">すべて</TabsTrigger>
                {categories.map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : error ? (
                  <div className="text-center p-4 text-red-500">{error}</div>
                ) : trainingData.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    トレーニングデータがありません。「データ追加」ボタンからデータをアップロードしてください。
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ファイル名</TableHead>
                          <TableHead>カテゴリ</TableHead>
                          <TableHead>サイズ</TableHead>
                          <TableHead>アップロード日時</TableHead>
                          <TableHead className="w-24">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trainingData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.filename}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category || '未分類'}</Badge>
                            </TableCell>
                            <TableCell>{formatFileSize(item.size)}</TableCell>
                            <TableCell>{formatDate(item.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" title="削除">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>データ削除の確認</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        本当に「{item.filename}」を削除しますか？この操作は元に戻せません。
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteData(item.id, item.path)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        削除
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TrainingPage;
