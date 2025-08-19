#!/bin/bash

# VS Code Extensions Installation Script for Thirty Challenge Project
# This script installs all recommended VS Code extensions for optimal development experience

echo "🚀 Installing VS Code Extensions for Thirty Challenge Project..."
echo "================================================="

# Essential TypeScript & React Development
echo "📦 Installing TypeScript & React Development Extensions..."
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension formulahendry.auto-rename-tag
code --install-extension ms-vscode.vscode-json

# React & JavaScript Tooling
echo "⚛️ Installing React & JavaScript Tooling..."
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension xabikos.JavaScriptSnippets
code --install-extension burkeholland.simple-react-snippets

# Code Quality & Formatting
echo "✨ Installing Code Quality & Formatting Extensions..."
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint

# Development Experience
echo "🛠️ Installing Development Experience Extensions..."
code --install-extension ms-vscode.vscode-thunder-client
code --install-extension humao.rest-client
code --install-extension ritwickdey.liveserver

# Testing & Debugging
echo "🧪 Installing Testing & Debugging Extensions..."
code --install-extension ms-vscode.vscode-jest
code --install-extension hbenl.vscode-test-explorer
code --install-extension ms-vscode.vscode-js-debug

# Git & Version Control
echo "📋 Installing Git & Version Control Extensions..."
code --install-extension eamodio.gitlens
code --install-extension github.vscode-pull-request-github
code --install-extension github.copilot
code --install-extension github.copilot-chat

# Productivity & Navigation
echo "🔍 Installing Productivity & Navigation Extensions..."
code --install-extension ms-vscode.vscode-outline
code --install-extension alefragnani.bookmarks
code --install-extension gruntfuggly.todo-tree
code --install-extension christian-kohler.path-intellisense

# Package Management
echo "📦 Installing Package Management Extensions..."
code --install-extension mrmlnc.vscode-duplicate
code --install-extension ms-vscode.npm-script-runner

# Database & Backend
echo "🗄️ Installing Database Extensions..."
code --install-extension supabase.supabase-sql-snippets

# Documentation & Markdown
echo "📝 Installing Documentation Extensions..."
code --install-extension yzhang.markdown-all-in-one
code --install-extension bierner.markdown-mermaid
code --install-extension davidanson.vscode-markdownlint

echo ""
echo "✅ All extensions have been installed!"
echo ""
echo "🎯 Next Steps:"
echo "1. Restart VS Code to ensure all extensions are loaded"
echo "2. Run 'pnpm dev' to start the development server"
echo "3. Open http://localhost:5173 to view the app"
echo "4. Check VS Code settings have been applied"
echo ""
echo "📚 For more information, see the README.md file"
echo "================================================="
