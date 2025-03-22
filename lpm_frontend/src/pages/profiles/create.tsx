import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';
import axios from 'axios';

interface Model {
  name: string;
  path: string;
  size: number;
  selected: boolean;
}

export default function CreateProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState(''); // 追加: 目的フィールド
  const [selectedModelPath, setSelectedModelPath] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  // パーソナリティ関連のフィールドを追加
  const [personality, setPersonality] = useState('');
  const [tone, setTone] = useState('neutral');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [customExpertise, setCustomExpertise] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectToChat, setRedirectToChat] = useState(true);

  // モデル一覧を取得
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get('/api/models');
        setModels(response.data.models || []);
        
        // デフォルトでモデルが存在すれば最初のものを選択
        if (response.data.models && response.data.models.length > 0) {
          setSelectedModelPath(response.data.models[0].path);
        }
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setError('モデル一覧の取得に失敗しました。サーバーの状態を確認してください。');
      }
    };

    fetchModels();
  }, []);

  // 専門分野を追加
  const addExpertise = () => {
    if (customExpertise.trim() && !expertise.includes(customExpertise.trim())) {
      setExpertise([...expertise, customExpertise.trim()]);
      setCustomExpertise('');
    }
  };

  // 専門分野を削除
  const removeExpertise = (item: string) => {
    setExpertise(expertise.filter(e => e !== item));
  };

  // パーソナリティからカスタムプロンプトを生成
  const generateSystemPrompt = (): string => {
    let prompt = '';
    
    // 名前と目的を追加
    prompt += `あなたは「${name}」という${purpose || '第2の自分'}です。\n\n`;
    
    // パーソナリティの説明があれば追加
    if (personality) {
      prompt += `${personality}\n\n`;
    }
    
    // 口調の設定を追加
    const toneMap: { [key: string]: string } = {
      'formal': '丁寧でフォーマルな口調で話してください。',
      'casual': 'カジュアルで親しみやすい口調で話してください。',
      'neutral': '中立的でバランスの取れた口調で話してください。',
      'enthusiastic': '熱意があり、積極的な口調で話してください。',
      'professional': 'プロフェッショナルで専門的な口調で話してください。',
      'humorous': 'ユーモアを交えた明るい口調で話してください。'
    };
    
    if (tone && toneMap[tone]) {
      prompt += `${toneMap[tone]}\n\n`;
    }
    
    // 専門分野があれば追加
    if (expertise.length > 0) {
      prompt += `特に「${expertise.join('」「')}」の分野に詳しく、これらについて質問されたら詳細に答えられます。\n\n`;
    }
    
    prompt += `ユーザーの質問に対して適切かつ有益な応答を提供してください。`;
    
    return prompt;
  };

  // プロファイル作成
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('第2の自分の名前を入力してください');
      return;
    }
    
    if (!purpose.trim()) {
      setError('目的を入力してください');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // システムプロンプトを生成
      const systemPrompt = generateSystemPrompt();
      
      // プロファイル作成APIを呼び出し
      const response = await axios.post('/api/profiles/create', {
        name: name.trim(),
        description: description.trim(),
        purpose: purpose.trim(),
        model_path: selectedModelPath,
        parameters: {
          temperature: 0.7,
          max_tokens: 2048
        },
        personality: {
          description: personality || '',
          tone: tone || 'neutral',
          expertise: expertise || [],
          custom_prompt: systemPrompt
        }
      });
      
      console.log("プロファイル作成レスポンス:", response.data);
      
      // レスポンスからプロファイルIDを取得
      const profileId = response.data.profile?.id;
      
      // プロファイルIDが存在する場合のみアクティブ化を試みる
      if (profileId) {
        try {
          // 作成したプロファイルをアクティブにする
          await axios.post('/api/profiles/activate', {
            profile_id: profileId
          });
          console.log("プロファイルのアクティブ化に成功:", profileId);
        } catch (activateErr: any) {
          console.error('Failed to activate profile:', activateErr);
          console.log("アクティブ化エラーのレスポンス:", activateErr.response?.data);
          // アクティブ化に失敗してもプロファイル作成は成功しているので、エラーとして扱わない
        }
      } else {
        console.warn("プロファイルIDが見つかりません。レスポンス:", response.data);
      }
      
      // 成功したら、選択した遷移先にリダイレクト
      if (redirectToChat) {
        router.push('/chat');
      } else {
        router.push('/profiles');
      }
    } catch (err: any) {
      console.error('Failed to create profile:', err);
      setError(`第2の自分の作成に失敗しました: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // モデルサイズを適切な単位で表示する関数
  const formatSize = (gigabytes: number): string => {
    return `${gigabytes.toFixed(2)} GB`;
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">第2の自分を作成</h1>
              <div className="flex space-x-2">
                <Link href="/profiles/wizard">
                  <Button variant="secondary">
                    ウィザード形式で作成
                  </Button>
                </Link>
                <Link href="/profiles" passHref>
                  <Button variant="outline">キャンセル</Button>
                </Link>
              </div>
            </div>

            {/* 概要説明 */}
            <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-md">
              <h2 className="font-medium text-lg mb-2">第2の自分とは？</h2>
              <p className="mb-2">
                第2の自分（Second Me）は、あなた自身のAI表現です。あなたの思考や知識、性格を反映し、
                あなたがいない場所でもあなたの代わりに応答することができます。
              </p>
              <p>
                まずは名前とその目的をつけましょう。例えば、「仕事用アシスタント」や「創作アイデア発想」など、
                用途に合わせた第2の自分を作ることができます。
              </p>
              <p className="mt-2 text-sm">
                より詳細な設定は<Link href="/profiles/wizard" className="underline">ウィザード形式</Link>で行うことができます。
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateProfile} className="space-y-6">
              {/* プロファイル名 */}
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

              {/* 目的 - 新規追加 */}
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

              {/* パーソナリティ設定 - 新規追加 */}
              <div>
                <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-1">
                  パーソナリティ
                </label>
                <textarea
                  id="personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="この第2の自分の性格や特性を詳しく説明してください"
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  例：「論理的思考が得意で、データに基づいた分析を好む。冗談も交えつつ、簡潔に要点を伝えることを心がける」など
                </p>
              </div>

              {/* 口調の設定 - 新規追加 */}
              <div>
                <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
                  コミュニケーションスタイル
                </label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="neutral">中立的 (標準)</option>
                  <option value="formal">丁寧・フォーマル</option>
                  <option value="casual">カジュアル・親しみやすい</option>
                  <option value="enthusiastic">熱意あり・積極的</option>
                  <option value="professional">プロフェッショナル・専門的</option>
                  <option value="humorous">ユーモア・明るい</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">この第2の自分が使う言葉遣いや話し方の特徴を選択します</p>
              </div>

              {/* 専門分野 - 新規追加 */}
              <div>
                <label htmlFor="expertise" className="block text-sm font-medium text-gray-700 mb-1">
                  専門分野・得意分野
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    id="expertise"
                    value={customExpertise}
                    onChange={(e) => setCustomExpertise(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="追加したい専門分野を入力"
                  />
                  <Button
                    type="button"
                    onClick={addExpertise}
                    disabled={!customExpertise.trim()}
                    className="whitespace-nowrap"
                  >
                    追加
                  </Button>
                </div>
                
                {expertise.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {expertise.map((item, index) => (
                      <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeExpertise(item)}
                          className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  この第2の自分が特に詳しい分野や得意とする話題を追加します
                </p>
              </div>

              {/* ベースモデル選択 */}
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  ベースモデル
                </label>
                {models.length === 0 ? (
                  <div className="p-3 bg-yellow-50 text-yellow-700 rounded-md">
                    <p>利用可能なモデルがありません。<Link href="/settings" className="text-blue-600 underline">設定ページ</Link>でモデルを選択または追加してください。</p>
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
                <p className="text-xs text-gray-500 mt-1">この第2の自分の基盤となるAIモデルを選択します。より高性能なモデルほど表現力が豊かになります。</p>
              </div>

              {/* リダイレクト先オプション */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="redirect-option"
                  checked={redirectToChat}
                  onChange={(e) => setRedirectToChat(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="redirect-option" className="text-sm text-gray-700">
                  作成後、すぐにチャットを開始する
                </label>
              </div>

              {/* メッセージ */}
              <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm text-gray-600">
                  作成後、あなたは第2の自分とチャットを通じて対話できます。また、後からメモリーデータをアップロードすることで、第2の自分をあなたにより近づけることができます。
                </p>
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading || !name.trim() || !purpose.trim() || models.length === 0}
                  className="px-6 py-2"
                >
                  {loading ? '作成中...' : '第2の自分を作成する'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
