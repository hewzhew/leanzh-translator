import * as vscode from 'vscode';
import { parseMarkdown, ParsedText } from './parser';
import { getWebviewContent } from './webview';

// 用于在内存中存储翻译内容的状态管理器
const translationState = new Map<number, { original: string, translation: string }>();

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "leanzh-translator" is now active!');

    const disposable = vscode.commands.registerCommand('leanzh-translator.startTranslation', async () => {
        // --- 每次启动时清空之前的翻译状态 ---
        translationState.clear();
        
        console.log('命令 "leanzh-translator.startTranslation" 已被成功触发！');
        vscode.window.showInformationMessage('翻译命令已启动！');

        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('请先打开一个文档');
                return;
            }

            const document = editor.document;
            if (document.languageId !== 'markdown') {
                vscode.window.showErrorMessage('请确保当前文档是Markdown格式');
                return;
            }

            const content = document.getText();
            // --- 动态导入 toString 并传递给 parseMarkdown ---
            const { toString } = await import('mdast-util-to-string');
            const parsedTexts = parseMarkdown(content, toString);
            // --- end ---
            
            if (parsedTexts.length === 0) {
                vscode.window.showErrorMessage('未找到需要翻译的文本内容');
                return;
            }

            const panel = vscode.window.createWebviewPanel(
                'translationView',
                '翻译助手 - ' + document.fileName.split('/').pop(),
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = getWebviewContent(parsedTexts);

            // 处理来自webview的消息
            panel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'translate':
                            const translation = await translateText(message.text);
                            panel.webview.postMessage({
                                command: 'translationResult',
                                id: message.id,
                                translation: translation
                            });
                            break;
                        case 'saveTranslation':
                            const originalText = parsedTexts[message.id]?.text;
                            if (originalText) {
                                translationState.set(message.id, { original: originalText, translation: message.text });
                                vscode.window.showInformationMessage(`已在内存中保存第 ${message.id + 1} 条翻译`);
                                console.log('当前所有已保存的翻译:', translationState);
                            }
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );
        } catch (error) {
            console.error('翻译过程中发生错误:', error);
            vscode.window.showErrorMessage('翻译失败，请在主窗口的“调试控制台”查看错误详情。');
        }
    });

    context.subscriptions.push(disposable);
}

async function translateText(text: string): Promise<string> {
    try {
        // 模拟AI翻译 - 实际使用时替换为真实的API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `[AI翻译] ${text}`;
    } catch (error) {
        if (error instanceof Error) {
            return `翻译失败: ${error.message}`;
        }
        return `翻译失败: ${String(error)}`;
    }
}

export function deactivate() {}
