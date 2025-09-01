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
            // マイクへのアクセスを要求
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // MediaRecorderの設定
            const options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.warn('audio/webm is not supported, trying audio/ogg');
                options.mimeType = 'audio/ogg';
            }
            
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];
            
            // データが利用可能になったときのハンドラ
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            // 録音停止時のハンドラ
            this.mediaRecorder.onstop = () => {
                this.onRecordingStopped();
            };
            
            // 録音開始
            this.mediaRecorder.start();
            this.isRecording = true;
            this.startTime = Date.now();
            this.startTimer();
            
            return true;
        } catch (error) {
            console.error('録音開始エラー:', error);
            throw error;
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