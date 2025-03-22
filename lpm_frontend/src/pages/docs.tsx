import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

// サイドバーのカテゴリーとトピックのデータ構造
interface Topic {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface Category {
  name: string;
  topics: Topic[];
}

const DocsPage = () => {
  // 選択中のトピックを状態として保存
  const [selectedTopic, setSelectedTopic] = useState<string>('getting-started');

  // ドキュメントのカテゴリーとトピックを定義
  const categories: Category[] = [
    {
      name: "はじめに",
      topics: [
        {
          id: "getting-started",
          title: "Second Meを始める",
          content: (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Second Meを始める</h1>
              <p>
                Second Meは、あなた自身のAI自己（AI self）を作成するためのオープンソースプロトコルです。
                このガイドでは、Windows環境でSecond Meをセットアップして使い始める方法を説明します。
              </p>
              
              <h2 className="text-xl font-semibold mt-6">前提条件</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Windows 10/11 オペレーティングシステム</li>
                <li>Git（インストール済み）</li>
                <li>Python 3.10以上</li>
                <li>Visual Studio 2019以上（C++コンパイラを含む）</li>
                <li>CMake 3.21以上</li>
                <li>Node.js 18.0以上</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6">インストール手順</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>リポジトリのクローン:</strong>
                  <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                    <code>
                      git clone https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows.git
                      <br/>
                      cd Second-Me-Windows
                    </code>
                  </pre>
                </li>
                <li>
                  <strong>環境のセットアップ:</strong>
                  <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                    <code>scripts\\setup.bat</code>
                  </pre>
                  <p className="mt-1">これにより自動的に:</p>
                  <ul className="list-disc pl-5">
                    <li>必要なシステム依存関係がチェックされます</li>
                    <li>Python venv 環境がセットアップされます</li>
                    <li>必要なPythonパッケージがインストールされます</li>
                    <li>llama.cppがビルドされます</li>
                    <li>フロントエンド環境がセットアップされます</li>
                  </ul>
                </li>
                <li>
                  <strong>サービスの開始:</strong>
                  <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                    <code>start-new-ui.bat</code>
                  </pre>
                </li>
                <li>
                  <strong>サービスへのアクセス:</strong>
                  <p>ブラウザを開き、<code>http://localhost:3000</code> にアクセスします。</p>
                </li>
              </ol>
              
              <h2 className="text-xl font-semibold mt-6">次のステップ</h2>
              <p>
                サービスが起動したら、<Link href="/create" className="text-blue-600 hover:underline">
                  作成ページ
                </Link>にアクセスしてあなた自身のAI自己を作成できます。手順に沿って、アイデンティティの定義、思い出のアップロード、AIのトレーニングを行いましょう。
              </p>
            </div>
          )
        },
        {
          id: "system-requirements",
          title: "システム要件",
          content: (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">システム要件</h1>
              <p>
                Second Meを快適に実行するには、以下のシステム要件を満たす必要があります。
              </p>
              
              <h2 className="text-xl font-semibold mt-6">最小要件</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>OS:</strong> Windows 10 (64ビット) バージョン 1909以降</li>
                <li><strong>プロセッサ:</strong> Intel Core i5-6500 / AMD Ryzen 5 1600 以上</li>
                <li><strong>メモリ:</strong> 8GB RAM</li>
                <li><strong>ストレージ:</strong> 10GB以上の空き容量（SSD推奨）</li>
                <li><strong>グラフィック:</strong> 統合グラフィックスで十分</li>
                <li><strong>インターネット:</strong> セットアップと初期設定に必要</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6">推奨要件</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>OS:</strong> Windows 10/11 (64ビット) 最新バージョン</li>
                <li><strong>プロセッサ:</strong> Intel Core i7-8700 / AMD Ryzen 7 3700X 以上</li>
                <li><strong>メモリ:</strong> 16GB RAM 以上</li>
                <li><strong>ストレージ:</strong> 20GB以上の空き容量（NVMe SSD推奨）</li>
                <li><strong>グラフィック:</strong> NVIDIA GeForce GTX 1660 / AMD Radeon RX 580 以上（AI処理の高速化に役立ちます）</li>
                <li><strong>インターネット:</strong> 安定した高速接続</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6">ソフトウェア要件</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Python:</strong> 3.10以上</li>
                <li><strong>Git:</strong> 最新バージョン</li>
                <li><strong>Visual Studio:</strong> 2019以上（C++コンパイラを含む）</li>
                <li><strong>CMake:</strong> 3.21以上</li>
                <li><strong>Node.js:</strong> 18.0以上</li>
              </ul>
              
              <p className="mt-4">
                これらの要件を満たすことで、Second Meをスムーズに実行できます。システム要件を満たしていない場合でも実行できる場合がありますが、パフォーマンスが低下する可能性があります。
              </p>
            </div>
          )
        },
      ]
    },
    {
      name: "機能ガイド",
      topics: [
        {
          id: "identity-definition",
          title: "アイデンティティの定義",
          content: (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">アイデンティティの定義</h1>
              <p>
                Second Meでは、あなた自身のAI自己を作成するための最初のステップとして、アイデンティティを定義します。
                このプロセスでは、あなたの基本的な特性や価値観を入力し、AIがあなたを適切に表現できるようにします。
              </p>
              
              <h2 className="text-xl font-semibold mt-6">アイデンティティの要素</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>基本情報:</strong> 名前、年齢、性別、職業など</li>
                <li><strong>価値観:</strong> あなたが大切にしている考え方や原則</li>
                <li><strong>興味・関心:</strong> 趣味、好きな活動、研究テーマなど</li>
                <li><strong>コミュニケーションスタイル:</strong> あなたの話し方や表現の特徴</li>
                <li><strong>経験:</strong> あなたの人生経験や背景</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6">アイデンティティの定義手順</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>プロフィール作成:</strong>
                  <p>基本的なプロフィール情報を入力します。</p>
                </li>
                <li>
                  <strong>価値観の共有:</strong>
                  <p>あなたが大切にしている価値観や原則を入力します。</p>
                </li>
                <li>
                  <strong>興味・関心の記録:</strong>
                  <p>あなたの興味、関心、趣味について記述します。</p>
                </li>
                <li>
                  <strong>コミュニケーションスタイルの記述:</strong>
                  <p>あなたの会話や文章の特徴について詳細を提供します。</p>
                </li>
                <li>
                  <strong>経験の共有:</strong>
                  <p>あなたの重要な人生経験や背景について説明します。</p>
                </li>
              </ol>
              
              <h2 className="text-xl font-semibold mt-6">アイデンティティ定義のヒント</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>具体的であるほど良い結果が得られます</li>
                <li>オープンで正直な情報を提供しましょう</li>
                <li>細部にこだわると、より良い結果につながります</li>
                <li>完璧である必要はありません - 後からいつでも更新できます</li>
              </ul>
              
              <p className="mt-4">
                アイデンティティの定義が完了したら、次のステップとして思い出のアップロードに進みます。
                このプロセスを通じて、AIがあなたの個性を理解し、より正確に反映できるようになります。
              </p>
            </div>
          )
        },
        {
          id: "memory-upload",
          title: "思い出のアップロード",
          content: (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">思い出のアップロード</h1>
              <p>
                Second Meでは、AIがあなたのアイデンティティをより深く理解するために、「思い出」をアップロードします。
                これらの思い出は、テキスト、画像、会話履歴などの形式で、あなたの経験や考え方を表すものです。
              </p>
              
              <h2 className="text-xl font-semibold mt-6">サポートされる思い出の種類</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>テキストファイル:</strong> メモ、日記、エッセイ、レポートなど (.txt, .doc, .docx, .pdf)</li>
                <li><strong>チャット履歴:</strong> メッセンジャーアプリやSNSの会話データ</li>
                <li><strong>SNSデータ:</strong> ツイート、ブログ記事、ソーシャルメディア投稿など</li>
                <li><strong>メール:</strong> 送受信したメールのアーカイブ</li>
                <li><strong>メモ:</strong> デジタルメモやノート</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6">思い出のアップロード手順</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>ファイル選択:</strong>
                  <p>「ファイルを選択」ボタンをクリックして、アップロードするファイルを選びます。</p>
                </li>
                <li>
                  <strong>ファイルの種類を指定:</strong>
                  <p>アップロードするコンテンツの種類（個人的な文章、仕事関連文書など）を選択します。</p>
                </li>
                <li>
                  <strong>プライバシー設定:</strong>
                  <p>アップロードするデータの共有範囲や使用制限を設定します。</p>
                </li>
                <li>
                  <strong>アップロード:</strong>
                  <p>「アップロード」ボタンをクリックしてファイルをシステムに送信します。</p>
                </li>
                <li>
                  <strong>処理の確認:</strong>
                  <p>ファイルが正常に処理されたことを確認します。</p>
                </li>
              </ol>
              
              <h2 className="text-xl font-semibold mt-6">効果的な思い出アップロードのヒント</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>多様な種類の思い出をアップロードすると、より豊かなAI自己が作成できます</li>
                <li>時間の経過とともに蓄積された思い出を含めると、あなたの成長や変化も反映されます</li>
                <li>個人的な文章や日記は特に有効です - 自分の考えや感情を率直に表現したものを選びましょう</li>
                <li>プライバシーに配慮して、特に機密性の高い情報は適切に管理しましょう</li>
              </ul>
              
              <p className="mt-4">
                思い出のアップロードが完了したら、次のステップとしてAIのトレーニングに進みます。
                アップロードした思い出は、すべてローカルに保存され、あなたのプライバシーは完全に保護されます。
              </p>
            </div>
          )
        },
        {
          id: "ai-training",
          title: "AIトレーニング",
          content: (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">AIトレーニング</h1>
              <p>
                アイデンティティの定義と思い出のアップロードが完了したら、次はAIのトレーニングを行います。
                このプロセスでは、提供された情報をもとにAIがあなたの思考パターンと特性を学習します。
              </p>
              
              <h2 className="text-xl font-semibold mt-6">トレーニングプロセスの概要</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>データの準備:</strong>
                  <p>アップロードされた思い出とアイデンティティ情報が処理され、トレーニングデータとして準備されます。</p>
                </li>
                <li>
                  <strong>モデルの初期化:</strong>
                  <p>基本のAIモデルが読み込まれ、あなた専用のAI自己の基盤として初期化されます。</p>
                </li>
                <li>
                  <strong>階層的メモリモデリング:</strong>
                  <p>HMM（階層的メモリモデリング）アルゴリズムを使用して、思い出から重要な特徴を抽出します。</p>
                </li>
                <li>
                  <strong>Me-Alignmentの適用:</strong>
                  <p>あなた特有の表現やコミュニケーションスタイルに合わせてモデルが調整されます。</p>
                </li>
                <li>
                  <strong>検証フェーズ:</strong>
                  <p>トレーニングされたモデルがあなたらしく応答できるか検証されます。</p>
                </li>
              </ol>
              
              <h2 className="text-xl font-semibold mt-6">トレーニング中の操作</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>トレーニング設定:</strong>
                  <p>トレーニングの詳細レベルや専門分野の重み付けなどを設定できます。</p>
                </li>
                <li>
                  <strong>進捗モニタリング:</strong>
                  <p>リアルタイムで進捗状況を確認できます。</p>
                </li>
                <li>
                  <strong>一時停止と再開:</strong>
                  <p>必要に応じてトレーニングプロセスを一時停止し、後で再開することができます。</p>
                </li>
                <li>
                  <strong>フィードバック提供:</strong>
                  <p>中間結果を確認し、必要に応じてフィードバックを提供できます。</p>
                </li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6">トレーニング完了後</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>モデル評価:</strong>
                  <p>トレーニングされたAI自己の質と正確さを評価できます。</p>
                </li>
                <li>
                  <strong>テスト会話:</strong>
                  <p>トレーニングされたAI自己と会話して、その反応を確認できます。</p>
                </li>
                <li>
                  <strong>微調整:</strong>
                  <p>必要に応じて追加のトレーニングや調整を行えます。</p>
                </li>
                <li>
                  <strong>設定の保存:</strong>
                  <p>成功したトレーニング設定を保存して、後の更新に使用できます。</p>
                </li>
              </ul>
              
              <p className="mt-4">
                AIトレーニングが完了すると、あなた自身のAI自己が利用可能になります。
                トレーニングは一度で完璧になるわけではなく、時間をかけて継続的に改善していくプロセスです。
                新しい思い出を追加し、定期的に再トレーニングすることで、AI自己はより正確になっていきます。
              </p>
            </div>
          )
        },
        {
          id: "network-settings",
          title: "ネットワーク設定",
          content: (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">ネットワーク設定</h1>
              <p>
                Second Meでは、トレーニングしたAI自己をSecond Meネットワークに接続して、他のユーザーやアプリケーションとの
                相互作用を可能にすることができます。このガイドでは、ネットワーク設定の方法と活用方法を説明します。
              </p>
              
              <h2 className="text-xl font-semibold mt-6">ネットワーク機能の概要</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>分散型ネットワーク:</strong> 中央サーバーに依存しない分散型のP2Pネットワーク</li>
                <li><strong>セキュアな接続:</strong> すべての通信が暗号化されます</li>
                <li><strong>プライバシー制御:</strong> 共有する情報とアクセス権を細かく設定可能</li>
                <li><strong>AI自己の共有:</strong> あなたのAI自己に特定のユーザーやアプリからのアクセスを許可</li>
                <li><strong>AIスペース:</strong> 複数のAI自己が協力して作業できる仮想環境</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6">ネットワーク設定の手順</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>ネットワーク接続の有効化:</strong>
                  <p>「ネットワーク設定」ページでトグルスイッチをオンにして、ネットワーク機能を有効にします。</p>
                </li>
                <li>
                  <strong>接続ノードの設定:</strong>
                  <p>接続するノードを選択するか、自動検出を有効にします。</p>
                </li>
                <li>
                  <strong>共有設定:</strong>
                  <p>
                    以下のオプションから選択して、AI自己の共有レベルを設定します：
                    <ul className="list-disc pl-5 mt-2">
                      <li>プライベート（自分のみ）</li>
                      <li>特定のユーザーと共有</li>
                      <li>特定のアプリケーションと共有</li>
                      <li>公開（すべてのSecond Meユーザーがアクセス可能）</li>
                    </ul>
                  </p>
                </li>
                <li>
                  <strong>アクセス制御:</strong>
                  <p>特定のユーザーやアプリケーションを招待し、アクセス権を設定します。</p>
                </li>
                <li>
                  <strong>設定の保存:</strong>
                  <p>設定を保存して適用します。</p>
                </li>
              </ol>
              
              <h2 className="text-xl font-semibold mt-6">ネットワーク活用のヒント</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>AIスペースの活用:</strong>
                  <p>複数のユーザーのAI自己が集まって協力できるAIスペースを作成・参加できます。</p>
                </li>
                <li>
                  <strong>アプリケーション連携:</strong>
                  <p>承認済みのアプリケーションがあなたのAI自己にアクセスして、より個人化されたサービスを提供できます。</p>
                </li>
                <li>
                  <strong>ロールベースのアクセス:</strong>
                  <p>共有相手に応じてAI自己の異なる側面を見せるロールを設定できます。</p>
                </li>
                <li>
                  <strong>接続状態のモニタリング:</strong>
                  <p>ネットワークダッシュボードで接続状態やアクセスログを確認できます。</p>
                </li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-6">プライバシーとセキュリティ</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>すべての通信はエンドツーエンドの暗号化で保護されます</li>
                <li>データはすべてローカルで処理され、許可なく第三者と共有されることはありません</li>
                <li>アクセス許可はいつでも変更または取り消すことができます</li>
                <li>詳細なアクティビティログでアクセス履歴を確認できます</li>
              </ul>
              
              <p className="mt-4">
                ネットワーク設定を通じて、あなたのAI自己の可能性を拡大し、様々なシナリオで活用できます。
                常に自分自身のデータとプライバシーを完全に制御しながら、AI自己の力を最大限に引き出しましょう。
              </p>
            </div>
          )
        }
      ]
    },
    {
      name: "トラブルシューティング",
      topics: [
        {
          id: "common-issues",
          title: "よくある問題と解決方法",
          content: (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">よくある問題と解決方法</h1>
              <p>
                Second Meを使用する際に遭遇する可能性のある一般的な問題とその解決方法を紹介します。
              </p>
              
              <h2 className="text-xl font-semibold mt-6">インストールと起動の問題</h2>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold">「Python is not installed or not in PATH」エラー</h3>
                <div className="pl-5">
                  <p><strong>原因:</strong> Pythonがインストールされていないか、システムのPATHに追加されていません。</p>
                  <p><strong>解決策:</strong></p>
                  <ol className="list-decimal pl-5">
                    <li>Pythonがインストールされていることを確認します（バージョン3.10以上が必要）</li>
                    <li>インストール時に「Add Python to PATH」オプションを選択します</li>
                    <li>既にインストールしている場合は、システム環境変数でPATHにPythonディレクトリを追加します</li>
                  </ol>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold">「Visual C++ compiler not found」エラー</h3>
                <div className="pl-5">
                  <p><strong>原因:</strong> 必要なC++コンパイラがインストールされていません。</p>
                  <p><strong>解決策:</strong></p>
                  <ol className="list-decimal pl-5">
                    <li>Visual Studioをインストールします（Community版で十分です）</li>
                    <li>インストール時に「C++によるデスクトップ開発」ワークロードを選択します</li>
                    <li>インストール後、コンピュータを再起動します</li>
                  </ol>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold">「CMake is not installed or not in PATH」エラー</h3>
                <div className="pl-5">
                  <p><strong>原因:</strong> CMakeがインストールされていないか、PATHに追加されていません。</p>
                  <p><strong>解決策:</strong></p>
                  <ol className="list-decimal pl-5">
                    <li><a href="https://cmake.org/download/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">CMakeの公式サイト</a>からインストーラをダウンロードします</li>
                    <li>インストール時に「Add CMake to the system PATH」オプションを選択します</li>
                    <li>インストール後、コンピュータを再起動します</li>
                  </ol>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold">llama.cppのビルドエラー</h3>
                <div className="pl-5">
                  <p><strong>原因:</strong> コンパイラの設定や依存関係の問題。</p>
                  <p><strong>解決策:</strong></p>
                  <ol className="list-decimal pl-5">
                    <li>Visual Studioの開発者コマンドプロンプトからセットアップを実行します</li>
                    <li>CMakeのバージョンが3.21以上であることを確認します</li>
                    <li>必要なすべての依存関係がインストールされていることを確認します</li>
                    <li>詳細については <code>docs/llama_cpp_windows.md</code> を参照してください</li>
                  </ol>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mt-6">実行時の問題</h2>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold">「Python virtual environment not found」エラー</h3>
                <div className="pl-5">
                  <p><strong>原因:</strong> 仮想環境が正しく作成されていないか、名前が間違っています。</p>
                  <p><strong>解決策:</strong></p>
                  <ol className="list-decimal pl-5">
                    <li>セットアップスクリプト（setup.bat）を再実行します</li>
                    <li>.envファイルでVENV_NAMEが正しく設定されていることを確認します</li>
                    <li>手動で仮想環境を作成する場合は：<code>python -m venv second-me-venv</code></li>
                  </ol>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold">ポートが既に使用されているエラー</h3>
                <div className="pl-5">
                  <p><strong>原因:</strong> デフォルトポート（3000または8002）が他のアプリケーションで使用中です。</p>
                  <p><strong>解決策:</strong></p>
                  <ol className="list-decimal pl-5">
                    <li>使用中のアプリケーションを終了します</li>
                    <li>.envファイルでポート設定を変更します：
                      <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                        <code>
                          PORT=3001
                          <br/>
                          API_PORT=8003
                        </code>
                      </pre>
                    </li>
                    <li>タスクマネージャーを使用して、ポートを使用しているプロセスを特定し終了します</li>
                  </ol>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold">バックエンド接続エラー</h3>
                <div className="pl-5">
                  <p><strong>原因:</strong> フロントエンドがバックエンドAPIに接続できません。</p>
                  <p><strong>解決策:</strong></p>
                  <ol className="list-decimal pl-5">
                    <li><code>debug-connection.bat</code>を実行して接続問題を診断します</li>
                    <li>バックエンドプロセスが実行中であることを確認します</li>
                    <li>ファイアウォールがAPIポートへの接続を許可していることを確認します</li>
                    <li>CORS問題が発生している場合は<code>start-with-cors.bat</code>を使用して起動します</li>
                  </ol>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mt-6">一般的なエラーメッセージとその解決方法</h2>
              <table className="min-w-full border border-gray-300 mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">エラーメッセージ</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">解決方法</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Failed to load model</td>
                    <td className="border border-gray-300 px-4 py-2">モデルファイルが正しくダウンロードされているか確認。必要に応じて再ダウンロード。</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Cannot allocate memory</td>
                    <td className="border border-gray-300 px-4 py-2">他のアプリケーションを閉じてメモリを解放。モデルサイズを小さいものに変更。</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">No such file or directory</td>
                    <td className="border border-gray-300 px-4 py-2">指定されたファイルパスが正しいか確認。スラッシュとバックスラッシュの使用に注意。</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Permission denied</td>
                    <td className="border border-gray-300 px-4 py-2">管理者権限でコマンドプロンプトを開いて実行。</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">ModuleNotFoundError</td>
                    <td className="border border-gray-300 px-4 py-2">不足しているPythonパッケージをインストール。</td>
                  </tr>
                </tbody>
              </table>
              
              <p className="mt-6">
                問題が解決しない場合は、<Link href="https://github.com/ZundamonnoVRChatkaisetu/Second-Me-Windows/issues" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  GitHubのIssues
                </Link>で詳細な情報と共に問題を報告してください。
                また、<code>logs</code>フォルダ内のログファイルが問題解決に役立ちます。
              </p>
            </div>
          )
        },
        {
          id: "debug-tools",
          title: "デバッグツール",
          content: (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">デバッグツール</h1>
              <p>
                Second Meには、問題を診断し解決するための様々なデバッグツールが用意されています。
                このガイドでは、それらのツールの使い方と活用方法を説明します。
              </p>
              
              <h2 className="text-xl font-semibold mt-6">組み込みデバッグスクリプト</h2>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold">debug-connection.bat</h3>
                <div className="pl-5">
                  <p><strong>目的:</strong> ネットワーク接続の問題を診断します。</p>
                  <p><strong>使用方法:</strong></p>
                  <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                    <code>debug-connection.bat</code>
                  </pre>
                  <p><strong>診断内容:</strong></p>
                  <ul className="list-disc pl-5">
                    <li>バックエンドサービスの状態確認</li>
                    <li>ポートの使用状況確認</li>
                    <li>ファイアウォール設定チェック</li>
                    <li>CORS設定の確認</li>
                    <li>ネットワークレイテンシーのテスト</li>
                  </ul>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mt-6">ログファイル</h2>
              <p>
                Second Meは様々なログファイルを生成し、問題の診断に役立てることができます。
                主要なログファイルは<code>logs</code>ディレクトリにあります。
              </p>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold">主要なログファイル</h3>
                <ul className="list-disc pl-5">
                  <li><strong>backend.log</strong> - バックエンドサービスのログ</li>
                  <li><strong>frontend.log</strong> - フロントエンドの起動と実行ログ</li>
                  <li><strong>llama.log</strong> - LLaMA.cppモデルの操作ログ</li>
                  <li><strong>api.log</strong> - APIリクエストとレスポンスのログ</li>
                  <li><strong>error.log</strong> - エラーメッセージの詳細ログ</li>
                </ul>
                
                <p className="mt-2">
                  これらのログファイルは、問題が発生した場合に最初に確認すべき場所です。
                  特に<code>error.log</code>には詳細なスタックトレースが含まれ、エラーの原因を特定するのに役立ちます。
                </p>
              </div>
              
              <h2 className="text-xl font-semibold mt-6">デバッグモード</h2>
              <p>
                Second Meには組み込みのデバッグモードがあり、より詳細な情報を表示できます。
              </p>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold">デバッグモードの有効化</h3>
                <p><strong>方法1: .envファイルを編集</strong></p>
                <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                  <code>
                    DEBUG=true
                    <br/>
                    LOG_LEVEL=debug
                  </code>
                </pre>
                
                <p className="mt-2">
                  デバッグモードでは以下の追加情報が表示されます：
                </p>
                <ul className="list-disc pl-5">
                  <li>詳細なAPIリクエスト/レスポンス</li>
                  <li>メモリ使用状況</li>
                  <li>処理時間の詳細</li>
                  <li>内部状態の変化</li>
                  <li>モデルのトークン処理の詳細</li>
                </ul>
              </div>
              
              <h2 className="text-xl font-semibold mt-6">バグの報告方法</h2>
              <p>
                バグを報告する際は、以下の情報を含めると問題解決が早くなります：
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>使用しているSecond Meのバージョン</li>
                <li>OSのバージョンと環境（Windows 10/11, ビルド番号など）</li>
                <li>発生した問題の詳細な説明</li>
                <li>問題を再現する手順</li>
                <li>関連するログファイルの内容</li>
                <li>スクリーンショット（可能であれば）</li>
              </ul>
              
              <p className="mt-4">
                これらのデバッグツールを活用することで、多くの一般的な問題を自己解決できます。
                より高度な問題や解決できない問題については、GitHubのIssuesで報告してください。
              </p>
            </div>
          )
        }
      ]
    }
  ];

  // 現在のトピックの内容を取得する関数
  const getCurrentTopicContent = () => {
    for (const category of categories) {
      const topic = category.topics.find(t => t.id === selectedTopic);
      if (topic) {
        return topic.content;
      }
    }
    return null;
  };

  return (
    <Layout>
      <Head>
        <title>ドキュメント - Second Me</title>
        <meta name="description" content="Second Meの詳細なドキュメントとガイド" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Second Me ドキュメント</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* サイドバー */}
          <div className="w-full md:w-1/4 bg-gray-50 p-4 rounded-lg">
            <div className="sticky top-24">
              {categories.map((category) => (
                <div key={category.name} className="mb-6">
                  <h2 className="font-bold text-lg mb-2">{category.name}</h2>
                  <ul className="space-y-2">
                    {category.topics.map((topic) => (
                      <li key={topic.id}>
                        <button
                          onClick={() => setSelectedTopic(topic.id)}
                          className={`w-full text-left px-3 py-2 rounded hover:bg-gray-200 transition-colors ${
                            selectedTopic === topic.id ? 'bg-blue-100 text-blue-800 font-medium' : ''
                          }`}
                        >
                          {topic.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          {/* メインコンテンツ */}
          <div className="w-full md:w-3/4 bg-white p-6 rounded-lg shadow">
            {getCurrentTopicContent()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DocsPage;
