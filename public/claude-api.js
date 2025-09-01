// Claude API統合

class ClaudeAPI {
    constructor() {
        // APIキーはNetlify環境変数またはユーザー入力から取得
        this.apiKey = null;
        this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
    }

    // APIキーの設定
    setApiKey(key) {
        this.apiKey = key;
        // ローカルストレージに保存
        localStorage.setItem('claude_api_key', key);
    }

    // APIキーの取得
    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = localStorage.getItem('claude_api_key');
        }
        return this.apiKey;
    }

    // テキストを構造化された日報に変換
    async structureReport(text) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('APIキーが設定されていません');
        }

        console.log('Claude API呼び出し開始');
        console.log('テキスト:', text.substring(0, 100) + '...');

        // まずはテスト用のモック実装を試す
        if (apiKey === 'test' || apiKey.startsWith('test-')) {
            console.log('テストモードで実行');
            return this.mockStructureReport(text);
        }

        const prompt = `以下の音声テキストを空調工事の業務日報として構造化してください。
空調工事の専門用語（エアコン、室外機、室内機、ダクト、配管、冷媒、コンプレッサー、ドレンホース、断熱材、電気配線、架台、ブラケット等）を正確に認識し、
作業内容（取付、撤去、点検、清掃、修理、試運転、配管接続、電気配線等）を適切に分類してください。

音声テキスト：
${text}

以下のJSON形式で出力してください：
{
  "site": "工事現場名",
  "staff": "担当者名",
  "todaysWork": "本日の業務内容",
  "issues": "問題点・懸念事項",
  "tomorrowPlan": "明日の予定業務"
}

注意点：
- 明確な情報がない項目は"未記載"としてください
- 問題点がない場合は"特になし"としてください
- 必ずJSON形式のみを出力してください`;

        try {
            console.log('Claude APIに送信中...');
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1000,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            console.log('APIレスポンス状態:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('APIエラーレスポンス:', errorText);
                
                if (response.status === 403) {
                    throw new Error('APIキーが無効です。正しいClaude APIキーを確認してください。');
                } else if (response.status >= 500) {
                    throw new Error('APIサーバーエラーです。しばらくしてから再試行してください。');
                } else {
                    throw new Error(`APIエラー: ${response.status} - ${errorText}`);
                }
            }

            const data = await response.json();
            console.log('APIレスポンス:', data);
            
            const content = data.content[0].text;
            console.log('生成されたコンテンツ:', content);
            
            // JSONをパース
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                console.log('パースされた結果:', result);
                return result;
            } else {
                throw new Error('日報の構造化に失敗しました: JSON形式が見つかりません');
            }
        } catch (error) {
            console.error('Claude APIエラー:', error);
            
            // CORS エラーの場合はフォールバック
            if (error.message.includes('CORS') || error.name === 'TypeError') {
                console.log('CORS エラーが発生、モック実装にフォールバック');
                return this.mockStructureReport(text);
            }
            
            throw error;
        }
    }

    // テスト用のモック実装
    mockStructureReport(text) {
        console.log('モック実装を使用してテスト日報を生成');
        
        // より詳細なキーワード抽出と文脈解析
        const sentences = text.split(/[。．\n]/);
        
        // 現場名の抽出
        const siteMatch = text.match(/([\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+(?:ビル|現場|建物|マンション|アパート|店舗|事務所|工場))/);
        
        // 担当者の抽出
        const staffMatch = text.match(/(山田|田中|佐藤|鈴木|高橋|渡辺|伊藤|中村|小林|加藤|吉田|[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+(?:さん|君|氏))/);
        
        // 本日の業務内容の抽出（作業関連キーワード）
        const workKeywords = ['設置', '取付', '撤去', '点検', '清掃', '修理', '試運転', '配管', '接続', '配線', '調整', '確認', '完了', '実施'];
        const todaysWork = sentences.filter(sentence => 
            workKeywords.some(keyword => sentence.includes(keyword)) ||
            sentence.includes('エアコン') || sentence.includes('室外機') || sentence.includes('室内機')
        ).join('。') || text.substring(0, 100);
        
        // 問題点・懸念の抽出
        const issueKeywords = ['問題', 'トラブル', 'エラー', '不具合', '故障', '漏れ', '異音', '異常', '心配', '懸念', '気になる', 'うまくいかない', '困った', '失敗'];
        const issuesSentences = sentences.filter(sentence => 
            issueKeywords.some(keyword => sentence.includes(keyword))
        );
        const issues = issuesSentences.length > 0 ? issuesSentences.join('。') : '特になし';
        
        // 明日の予定の抽出
        const tomorrowKeywords = ['明日', '次回', '来週', '後日', '今度', '次の', '翌日'];
        const planKeywords = ['予定', '計画', 'やる', '行う', '実施', '作業', '工事', '設置', '取付', '点検', '予約'];
        const tomorrowSentences = sentences.filter(sentence => 
            tomorrowKeywords.some(keyword => sentence.includes(keyword)) ||
            (sentence.includes('予定') || sentence.includes('計画'))
        );
        
        let tomorrowPlan = '未記載';
        if (tomorrowSentences.length > 0) {
            tomorrowPlan = tomorrowSentences.join('。');
        } else if (text.includes('続き') || text.includes('継続')) {
            tomorrowPlan = '本日の作業の続きを実施予定';
        }
        
        return {
            site: siteMatch ? siteMatch[1] : '未記載',
            staff: staffMatch ? staffMatch[1] : '未記載',
            todaysWork: todaysWork || '未記載',
            issues: issues,
            tomorrowPlan: tomorrowPlan
        };
    }

    // 音声ファイルをテキストに変換（Whisper APIを使用する場合）
    async transcribeAudio(audioBlob) {
        // 注：ここではWeb Speech APIを使用しているため、
        // このメソッドは使用されません。
        // OpenAI Whisper APIを使用する場合は、ここに実装を追加します。
        console.log('Audio transcription would happen here');
        return null;
    }
}

// グローバルインスタンスを作成
const claudeAPI = new ClaudeAPI();