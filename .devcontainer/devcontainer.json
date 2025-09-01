{
  "name": "Claude Code for Web Development (Default)",
  // imageを削除してデフォルトを使用
  "features": {
    // 必要最小限の機能のみ
    "ghcr.io/devcontainers/features/github-cli:1": {
      "installDirectlyFromGitHubRelease": "true"
    }
  },
  "postCreateCommand": "bash .devcontainer/setup.sh",
  "customizations": {
    "vscode": {
      "extensions": [
        // 必須拡張機能のみ
        "Anthropic.claude-code",
        // Web開発支援（軽量）
        "bradlc.vscode-tailwindcss",
        "ritwickdey.liveserver",
        "formulahendry.auto-rename-tag",
        // UI/UX改善（最小限）
        "MS-CEINTL.vscode-language-pack-ja",
        "vscode-icons-team.vscode-icons"
      ],
      "settings": {
        "liveServer.settings.donotShowInfoMsg": true,
        "liveServer.settings.donotVerifyTags": true,
        "files.autoSave": "afterDelay",
        "files.autoSaveDelay": 1000,
        "editor.formatOnSave": true,
        "editor.minimap.enabled": false,
        "workbench.startupEditor": "readme",
        "explorer.confirmDelete": false,
        "explorer.confirmDragAndDrop": false
      }
    }
  },
  "forwardPorts": [
    3000,
    5000,
    8000,
    8080
  ],
  "portsAttributes": {
    "3000": {
      "label": "React/Node.js Server",
      "onAutoForward": "notify"
    },
    "5000": {
      "label": "Python Flask/FastAPI",
      "onAutoForward": "silent"
    },
    "8000": {
      "label": "Live Server",
      "onAutoForward": "silent"
    },
    "8080": {
      "label": "Alternative Server",
      "onAutoForward": "silent"
    }
  }
}