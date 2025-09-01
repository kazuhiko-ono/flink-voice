// メインアプリケーションロジック

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const recordingStatus = document.getElementById('recordingStatus');
    const audioFileInput = document.getElementById('audioFileInput');
    const audioPreview = document.getElementById('audioPreview');
    const audioPlayer = document.getElementById('audioPlayer');
    const textInput = document.getElementById('textInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const reportSection = document.getElementById('reportSection');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const copyBtn = document.getElementById('copyBtn');
    const saveBtn = document.getElementById('saveBtn');

    // 初期化時にAPIキーをチェック
    checkApiKey();

    // APIキーの確認と設定
    function checkApiKey() {
        const savedKey = claudeAPI.getApiKey();
        if (!savedKey) {
            showApiKeyPrompt();
        }
    }

    // APIキー入力プロンプト
    function showApiKeyPrompt() {
        const key = prompt('Claude APIキーを入力してください：\n\n※APIキーはhttps://console.anthropic.com/ から取得できます');
        if (key) {
            claudeAPI.setApiKey(key);
        } else {
            showError('APIキーが設定されていません。日報生成機能は使用できません。');
        }
    }

    // 録音開始ボタン
    recordBtn.addEventListener('click', async () => {
        console.log('録音開始ボタンがクリックされました');
        
        try {
            // ブラウザサポート確認
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('このブラウザは音声録音に対応していません');
            }
            
            console.log('音声録音を開始しています...');
            await audioRecorder.startRecording();
            console.log('音声録音が開始されました');
            
            if (speechRecognizer.recognition) {
                speechRecognizer.start();
                console.log('音声認識も開始されました');
            }
            
            recordBtn.disabled = true;
            stopBtn.disabled = false;
            recordingStatus.classList.remove('hidden');
            
            // ボタンのテキストとアイコンを更新
            document.getElementById('recordBtnText').textContent = '録音中...';
            recordBtn.classList.replace('bg-blue-500', 'bg-gray-400');
            recordBtn.classList.replace('hover:bg-blue-600', 'hover:bg-gray-400');
            
            showSuccess('録音を開始しました');
        } catch (error) {
            console.error('録音エラー:', error);
            showError('マイクへのアクセスに失敗しました: ' + error.message);
        }
    });

    // 録音停止ボタン
    stopBtn.addEventListener('click', () => {
        audioRecorder.stopRecording();
        if (speechRecognizer.recognition) {
            speechRecognizer.stop();
        }
        
        recordBtn.disabled = false;
        stopBtn.disabled = true;
        recordingStatus.classList.add('hidden');
        
        // ボタンのテキストとアイコンを戻す
        document.getElementById('recordBtnText').textContent = '録音開始';
        recordBtn.classList.replace('bg-gray-400', 'bg-blue-500');
        recordBtn.classList.replace('hover:bg-gray-400', 'hover:bg-blue-600');
    });

    // 録音完了イベントのリスナー
    window.addEventListener('recordingComplete', (event) => {
        const { blob, url } = event.detail;
        
        // 音声プレビューを表示
        audioPlayer.src = url;
        audioPreview.classList.remove('hidden');
        
        // 音声認識が使えない場合は、テキスト入力を促す
        if (!speechRecognizer.recognition) {
            showInfo('音声認識がサポートされていません。テキストを直接入力してください。');
        }
    });

    // ファイルアップロード処理
    audioFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            handleAudioFile(file);
        }
    });

    // ドラッグ&ドロップ処理
    const dropZone = audioFileInput.parentElement.parentElement;
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleAudioFile(files[0]);
        }
    });

    // 音声ファイル処理
    function handleAudioFile(file) {
        if (!file.type.startsWith('audio/')) {
            showError('音声ファイルを選択してください');
            return;
        }
        
        const url = URL.createObjectURL(file);
        audioPlayer.src = url;
        audioPreview.classList.remove('hidden');
        
        showInfo('音声ファイルがアップロードされました。テキストを入力して「日報を生成」をクリックしてください。');
    }

    // 解析ボタン
    analyzeBtn.addEventListener('click', async () => {
        console.log('解析ボタンがクリックされました');
        
        const text = textInput.value.trim();
        console.log('入力テキスト:', text);
        
        if (!text) {
            showError('テキストを入力してください');
            return;
        }
        
        const apiKey = claudeAPI.getApiKey();
        console.log('APIキーの状態:', apiKey ? 'あり' : 'なし');
        
        if (!apiKey) {
            showApiKeyPrompt();
            if (!claudeAPI.getApiKey()) {
                return;
            }
        }
        
        try {
            console.log('日報生成を開始します...');
            showLoading(true);
            hideError();
            
            const report = await claudeAPI.structureReport(text);
            console.log('生成された日報:', report);
            
            displayReport(report);
            
            showLoading(false);
            showSuccess('日報が生成されました');
        } catch (error) {
            console.error('日報生成エラー:', error);
            showLoading(false);
            showError('日報の生成に失敗しました: ' + error.message);
        }
    });

    // 日報表示
    function displayReport(report) {
        document.getElementById('reportSite').textContent = report.site || '未記載';
        document.getElementById('reportStaff').textContent = report.staff || '未記載';
        document.getElementById('reportTodaysWork').textContent = report.todaysWork || '未記載';
        document.getElementById('reportIssues').textContent = report.issues || '特になし';
        document.getElementById('reportTomorrowPlan').textContent = report.tomorrowPlan || '未記載';
        
        reportSection.classList.remove('hidden');
    }

    // コピーボタン
    copyBtn.addEventListener('click', () => {
        const reportText = formatReportAsText();
        navigator.clipboard.writeText(reportText).then(() => {
            showSuccess('日報をクリップボードにコピーしました');
        }).catch(() => {
            showError('コピーに失敗しました');
        });
    });

    // 保存ボタン
    saveBtn.addEventListener('click', () => {
        const reportData = getReportData();
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');
        
        reportData.date = new Date().toISOString();
        reports.push(reportData);
        
        localStorage.setItem('reports', JSON.stringify(reports));
        showSuccess('日報を保存しました');
    });

    // 日報データの取得
    function getReportData() {
        return {
            site: document.getElementById('reportSite').textContent,
            staff: document.getElementById('reportStaff').textContent,
            todaysWork: document.getElementById('reportTodaysWork').textContent,
            issues: document.getElementById('reportIssues').textContent,
            tomorrowPlan: document.getElementById('reportTomorrowPlan').textContent
        };
    }

    // 日報をテキスト形式に変換
    function formatReportAsText() {
        const data = getReportData();
        return `【業務日報】
日付：${new Date().toLocaleDateString('ja-JP')}

工事現場名：${data.site}
担当者：${data.staff}

本日の業務：
${data.todaysWork}

問題点・懸念：
${data.issues}

明日の予定業務：
${data.tomorrowPlan}`;
    }

    // ローディング表示
    function showLoading(show) {
        if (show) {
            loadingIndicator.classList.remove('hidden');
            analyzeBtn.disabled = true;
        } else {
            loadingIndicator.classList.add('hidden');
            analyzeBtn.disabled = false;
        }
    }

    // エラー表示
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    // エラー非表示
    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // 成功メッセージ表示
    function showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // 情報メッセージ表示
    function showInfo(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.background = '#3b82f6';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // エンターキーでも解析実行
    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            analyzeBtn.click();
        }
    });
});