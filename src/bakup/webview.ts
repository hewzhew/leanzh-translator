import type { ParsedText } from './parser';

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function getWebviewContent(parsedTexts: ParsedText[]): string {
    const textItems = parsedTexts.map((item, index) => 
        `<div class="text-item" data-index="${index}">
            <div class="text-header">
                <span class="text-type">${item.type}</span>
                ${item.line ? `<span class="line-number">第${item.line}行</span>` : ''}
            </div>
            <div class="original-text">${escapeHtml(item.text)}</div>
            <div class="translation-area">
                <textarea id="translation-${index}" placeholder="翻译内容..."></textarea>
                <div class="buttons">
                    <button onclick="translateWithAI(${index}, '${escapeHtml(item.text)}')">AI翻译</button>
                    <button onclick="saveTranslation(${index})">保存翻译</button>
                </div>
            </div>
        </div>`
    ).join('');

    return `<!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lean4文档翻译助手</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 20px; 
                margin: 0;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .text-item {
                margin-bottom: 30px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 16px;
                background-color: var(--vscode-panel-background);
            }
            .text-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
            }
            .text-type {
                background: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: bold;
            }
            .original-text {
                background-color: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                padding: 12px;
                margin: 10px 0;
                white-space: pre-wrap;
                font-family: 'Courier New', monospace;
            }
            .translation-area textarea {
                width: 100%;
                height: 80px;
                padding: 8px;
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                font-family: inherit;
                resize: vertical;
            }
            .buttons {
                margin-top: 10px;
                display: flex;
                gap: 10px;
            }
            button {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                cursor: pointer;
                font-size: 12px;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .loading {
                opacity: 0.6;
                pointer-events: none;
            }
        </style>
    </head>
    <body>
        <h1>🌐 Lean4文档翻译助手</h1>
        <p>共找到 <strong>${parsedTexts.length}</strong> 个需要翻译的文本段落</p>
        <div class="translation-container">
            ${textItems}
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            
            function translateWithAI(index, text) {
                const button = event.target;
                const textarea = document.getElementById('translation-' + index);
                
                button.textContent = '翻译中...';
                button.disabled = true;
                
                vscode.postMessage({
                    command: 'translate',
                    id: index,
                    text: text
                });
            }
            
            function saveTranslation(index) {
                const textarea = document.getElementById('translation-' + index);
                const translation = textarea.value.trim();
                
                if (!translation) {
                    alert('请先输入翻译内容');
                    return;
                }
                
                vscode.postMessage({
                    command: 'saveTranslation',
                    id: index,
                    text: translation
                });
            }
            
            // 监听来自扩展的消息
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'translationResult':
                        const textarea = document.getElementById('translation-' + message.id);
                        const button = document.querySelector('[onclick*="translateWithAI(' + message.id + ',"]');
                        
                        textarea.value = message.translation;
                        button.textContent = 'AI翻译';
                        button.disabled = false;
                        break;
                }
            });
        </script>
    </body>
    </html>`;
}
