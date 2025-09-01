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

        // テスト用のモック実装を試す
        if (apiKey === 'test' || apiKey === 'test-mode' || apiKey?.startsWith('test-')) {
            console.log('テストモードで実行');
            return this.mockStructureReport(text);
        }

        const prompt = `あなたは空調工事業界の業務日報作成の専門家です。以下の業務報告テキストを適切に分析し、5つの項目に正確に振り分けてください。

## 業務報告テキスト：
${text}

## 分析ルール：

### 1. 工事現場名 (site)
- 「〇〇ビル」「〇〇マンション」「〇〇現場」「〇〇建物」「〇〇店舗」等の固有名詞
- 住所や場所の情報も含む

### 2. 担当者 (staff)
- 人名（「山田さん」「田中氏」等）
- 「担当：」「責任者：」「作業員：」の後に続く名前
- 複数名いる場合はカンマ区切り

### 3. 本日の業務内容 (todaysWork)
- **実際に完了した作業のみ**
- 作業キーワード：設置、取付、撤去、点検、清掃、修理、試運転、配管接続、電気配線、調整
- 機器名：エアコン、室外機、室内機、ダクト、配管、冷媒等
- **問題点や明日の予定は除外**

### 4. 問題点・懸念事項 (issues)
- 「問題」「トラブル」「エラー」「不具合」「故障」「異常」を含む内容
- 「心配」「懸念」「気になる」等の懸念事項
- 未完了の作業や遅延
- **具体的な問題内容のみ抽出**

### 5. 明日の予定業務 (tomorrowPlan)
- 「明日」「次回」「来週」「後日」を含む予定
- 「予定」「計画」を含む未来の作業
- 継続作業や次回実施予定の内容

## 例示：
入力：「今日は山田ビルで室外機設置しました。配線に問題がありました。明日は室内機を予定しています。」
出力：
{
  "site": "山田ビル",
  "staff": "未記載",
  "todaysWork": "室外機設置しました",
  "issues": "配線に問題がありました",
  "tomorrowPlan": "明日は室内機を予定しています"
}

## 分析手順：
1. まず全体を読んで文脈を理解
2. キーワードを特定（現場名、人名、作業内容、問題、予定）
3. 時制を確認（過去形=完了、未来形=予定）
4. 各項目に適切に振り分け

## 出力形式：
必ずJSON形式で出力してください：
{
  "site": "工事現場名または未記載",
  "staff": "担当者名または未記載", 
  "todaysWork": "完了した作業内容",
  "issues": "問題点・懸念または特になし",
  "tomorrowPlan": "明日の予定または未記載"
}

## 重要な注意点：
- 各項目は重複させない（同じ内容を複数項目に入れない）
- 推測や補完はしない（明記された内容のみ）
- 曖昧な表現も正確に抽出する
- JSON形式以外は一切出力しない`;

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
        console.log('解析対象テキスト:', text);
        
        // 文章を分割（句点、改行、ピリオドで分割し、空文字を除外）
        // 句点がない場合は、キーワードベースで分割
        let sentences;
        if (text.includes('。') || text.includes('．') || text.includes('\n')) {
            sentences = text.split(/[。．\.\n]/).filter(s => s.trim().length > 0);
        } else {
            // 句点がない場合は「問題点」「明日」などのキーワードで分割を試みる
            sentences = [text]; // 全体を一つの文として扱い、キーワードベースで部分抽出
        }
        console.log('分割された文章:', sentences);
        
        // 現場名の抽出
        const siteMatch = text.match(/([\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+(?:ビル|現場|建物|マンション|アパート|店舗|事務所|工場))/);
        
        // 担当者の抽出
        const staffMatch = text.match(/(山田|田中|佐藤|鈴木|高橋|渡辺|伊藤|中村|小林|加藤|吉田|[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+(?:さん|君|氏))/);
        
        // 問題点・懸念の抽出（正規表現で部分的に抽出）
        const issueKeywords = ['問題点', '問題', 'トラブル', 'エラー', '不具合', '故障', '漏れ', '異音', '異常', '心配', '懸念', '気になる', 'うまくいかない', '困った', '失敗', '課題'];
        let issues = '特になし';
        
        // 「問題点は〜」「問題は〜」のパターンを探す
        const issuePatterns = [
            /問題点は([^。]*[^明日]*)/,
            /問題は([^。]*[^明日]*)/,
            /トラブルは([^。]*[^明日]*)/,
            /不具合は([^。]*[^明日]*)/
        ];
        
        for (const pattern of issuePatterns) {
            const match = text.match(pattern);
            if (match) {
                issues = match[1].trim();
                console.log('正規表現で検出された問題点:', issues);
                break;
            }
        }
        
        // パターンマッチングで見つからない場合は、キーワードベース検索
        if (issues === '特になし') {
            const issuesSentences = sentences.filter(sentence => {
                const hasIssueKeyword = issueKeywords.some(keyword => sentence.includes(keyword));
                console.log(`文章「${sentence}」は問題キーワードを含む: ${hasIssueKeyword}`);
                return hasIssueKeyword;
            });
            if (issuesSentences.length > 0) {
                issues = issuesSentences.join('。');
            }
        }
        console.log('最終的な問題点:', issues);
        
        // 明日の予定の抽出（正規表現で部分的に抽出）
        let tomorrowPlan = '未記載';
        
        // 「明日の業務は〜」「明日の業務に関しては〜」のパターンを探す
        const tomorrowPatterns = [
            /明日の業務は([^今日]*)/,
            /明日の業務に関しては([^今日]*)/,
            /明日の予定は([^今日]*)/,
            /明日の作業は([^今日]*)/,
            /明日は([^今日]*)/
        ];
        
        for (const pattern of tomorrowPatterns) {
            const match = text.match(pattern);
            if (match) {
                tomorrowPlan = match[1].trim();
                console.log('正規表現で検出された明日の予定:', tomorrowPlan);
                break;
            }
        }
        
        // パターンマッチングで見つからない場合は、キーワードベース検索
        if (tomorrowPlan === '未記載') {
            const tomorrowKeywords = ['明日の業務', '明日の予定', '明日の作業', '明日', '次回', '来週', '後日', '今度', '次の', '翌日'];
            const tomorrowSentences = sentences.filter(sentence => {
                const hasTomorrowKeyword = tomorrowKeywords.some(keyword => sentence.includes(keyword)) ||
                                          (sentence.includes('予定') && !sentence.includes('今日')) ||
                                          (sentence.includes('計画') && !sentence.includes('今日'));
                console.log(`文章「${sentence}」は明日キーワードを含む: ${hasTomorrowKeyword}`);
                return hasTomorrowKeyword;
            });
            
            if (tomorrowSentences.length > 0) {
                tomorrowPlan = tomorrowSentences.join('。');
            } else if (text.includes('続き') || text.includes('継続')) {
                tomorrowPlan = '本日の作業の続きを実施予定';
            }
        }
        console.log('最終的な明日の予定:', tomorrowPlan);
        
        // 本日の業務内容の抽出（問題点と明日の予定の部分を除く）
        let todaysWork = text;
        
        // 既に抽出した問題点と明日の予定の部分を除去
        if (issues !== '特になし' && text.includes(issues)) {
            todaysWork = todaysWork.replace(issues, '').replace(/問題点?は/, '').replace(/問題は/, '');
        }
        if (tomorrowPlan !== '未記載' && text.includes(tomorrowPlan)) {
            todaysWork = todaysWork.replace(tomorrowPlan, '').replace(/明日の業務[はに関して]*は?/, '');
        }
        
        // 不要な文字を整理
        todaysWork = todaysWork.replace(/\s+/g, ' ').trim();
        
        // 空になった場合や短すぎる場合は、作業キーワードを含む部分を抽出
        if (todaysWork.length < 10) {
            const workKeywords = ['設置', '取付', '撤去', '点検', '清掃', '修理', '試運転', '配管', '接続', '配線', '調整', '確認', '完了', '実施', '作業'];
            const workParts = [];
            for (const keyword of workKeywords) {
                if (text.includes(keyword)) {
                    const match = text.match(new RegExp(`[^。]*${keyword}[^。]*`));
                    if (match) workParts.push(match[0]);
                }
            }
            todaysWork = workParts.length > 0 ? workParts.join('。') : '未記載';
        }
        
        console.log('検出された本日の業務:', todaysWork);
        
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