// 音声録音機能の実装

class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.startTime = null;
        this.timerInterval = null;
        this.isRecording = false;
    }

    // 録音開始
    async startRecording() {
        try {
            console.log('マイクアクセスを要求中...');
            
            // マイクへのアクセスを要求
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            console.log('マイクアクセス許可されました');
            
            // MediaRecorderの設定
            let options = {};
            
            // 対応フォーマットを確認
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options.mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options.mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                options.mimeType = 'audio/ogg;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                options.mimeType = 'audio/ogg';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options.mimeType = 'audio/mp4';
            }
            
            console.log('使用する音声フォーマット:', options.mimeType);
            
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];
            
            // データが利用可能になったときのハンドラ
            this.mediaRecorder.ondataavailable = (event) => {
                console.log('音声データ受信:', event.data.size);
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            // 録音停止時のハンドラ
            this.mediaRecorder.onstop = () => {
                console.log('録音停止イベント');
                this.onRecordingStopped();
            };
            
            // エラーハンドラ
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder エラー:', event.error);
            };
            
            // 録音開始
            console.log('録音を開始します...');
            this.mediaRecorder.start(100); // 100ms間隔でデータを収集
            this.isRecording = true;
            this.startTime = Date.now();
            this.startTimer();
            
            console.log('録音が開始されました');
            return true;
        } catch (error) {
            console.error('録音開始エラー:', error);
            
            if (error.name === 'NotAllowedError') {
                throw new Error('マイクへのアクセスが拒否されました。ブラウザの設定でマイクの使用を許可してください。');
            } else if (error.name === 'NotFoundError') {
                throw new Error('マイクが見つかりません。マイクが接続されていることを確認してください。');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('このブラウザは音声録音をサポートしていません。');
            } else {
                throw error;
            }
        }
    }

    // 録音停止
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.stopTimer();
            
            // ストリームを停止
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
        }
    }

    // 録音停止後の処理
    onRecordingStopped() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // カスタムイベントを発火
        const event = new CustomEvent('recordingComplete', {
            detail: {
                blob: audioBlob,
                url: audioUrl
            }
        });
        window.dispatchEvent(event);
    }

    // タイマー開始
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // 時間表示を更新
            const timeElement = document.getElementById('recordingTime');
            if (timeElement) {
                timeElement.textContent = timeString;
            }
        }, 100);
    }

    // タイマー停止
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // リソースのクリーンアップ
    cleanup() {
        this.stopRecording();
        this.audioChunks = [];
    }
}

// グローバルインスタンスを作成
const audioRecorder = new AudioRecorder();

// Web Speech APIを使用した音声認識（オプション）
class SpeechRecognizer {
    constructor() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'ja-JP';
            this.transcript = '';
            this.isListening = false;
            
            this.setupEventHandlers();
        } else {
            console.warn('Web Speech API is not supported');
            this.recognition = null;
        }
    }

    setupEventHandlers() {
        if (!this.recognition) return;
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript) {
                this.transcript += finalTranscript;
                this.updateTextInput(this.transcript);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
        };
    }

    start() {
        if (this.recognition && !this.isListening) {
            this.transcript = '';
            this.recognition.start();
            this.isListening = true;
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    updateTextInput(text) {
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.value = text;
        }
    }
}

// グローバルインスタンスを作成
const speechRecognizer = new SpeechRecognizer();