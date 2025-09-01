#!/bin/bash

# Claude Code for Web Development - 軽量セットアップ
echo "🌐 Claude Code Web開発環境をセットアップ中..."

# エラー時は停止
set -e

# カラー出力の設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}⚙️ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Claude Code のインストール（メイン機能）
print_step "Claude Code をインストール中..."
if npm install -g @anthropic-ai/claude-code; then
    print_success "Claude Code インストール完了"
else
    print_warning "Claude Code インストールに失敗しました。手動でインストールが必要かもしれません。"
fi

# 軽量なWeb開発ツールのみインストール
print_step "必要最小限のWeb開発ツールをインストール中..."
npm install -g live-server prettier 2>/dev/null || print_warning "一部のnpmパッケージのインストールに失敗しました"

# Pythonパッケージ（基本的なもののみ）
print_step "基本的なPython パッケージをインストール中..."
pip3 install --user --no-warn-script-location \
    requests \
    flask 2>/dev/null || print_warning "一部のPythonパッケージのインストールに失敗しました"

# 必要なディレクトリの作成
print_step "作業ディレクトリを作成中..."
mkdir -p ~/.anthropic
mkdir -p ./claude-tmp

# Claude Code 動作確認
print_step "Claude Code の動作確認中..."
if command -v claude &> /dev/null; then
    print_success "Claude Code が正常にインストールされました！"
    claude --version 2>/dev/null || true
else
    print_warning "Claude Code が見つかりません。再起動後に使用可能になります。"
fi

print_success "軽量セットアップ完了！"
echo ""
echo "🎉 Claude Code Web開発環境の準備ができました！"
echo ""
echo -e "${BLUE}💡 使い方のヒント:${NC}"
echo "1. ターミナルで 'claude' と入力してClaude Codeを起動"
echo "2. 初回は認証が必要です（APIキーの設定）"
echo "3. 「ウェブページを作って」「Pythonアプリを作って」と話しかけてみてください"
echo ""
echo -e "${BLUE}🌟 デフォルトイメージの利点:${NC}"
echo "- 使用容量がカウントされません"
echo "- 起動が高速です"
echo "- Node.js、Python、Gitが標準で利用可能"
echo ""
echo -e "${BLUE}🌐 プレビュー方法:${NC}"
echo "- HTMLファイルを右クリック → 'Open with Live Server'"
echo "- またはターミナルで 'live-server' (カレントディレクトリをサーブ)"