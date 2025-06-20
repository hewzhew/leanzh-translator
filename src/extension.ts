import * as vscode from 'vscode';
import axios from 'axios';
import { parseMarkdown, ParsedText } from './parser';
import { getWebviewContent } from './webview';
import { translateText } from './translate';
import { applyAllTranslations } from './applyTranslations';

// 用于在内存中存储翻译内容的状态管理器
const translationState = new Map<number, { original: string, translation: string }>();

const MODEL_SERVER_URL = 'http://localhost:3000/translate';

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
                            // DeepSeek AI 翻译
                            const config = vscode.workspace.getConfiguration('leanzh-translator');
                            const apiKey = config.get<string>('apiKey');
                            const translation = await translateText(message.text, apiKey || '');
                            panel.webview.postMessage({
                                command: 'translationResult',
                                id: message.id,
                                translation: translation
                            });
                            break;
                        case 'localTranslate':
                            // 本地模型服务器翻译
                            let translatedText = '本地翻译失败';
                            try {
                                const response = await axios.post(MODEL_SERVER_URL, {
                                    text: message.text
                                });
                                translatedText = response.data.translation_text;
                            } catch (error) {
                                if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
                                    vscode.window.showErrorMessage('无法连接到本地翻译服务器。请确认您已在终端中运行 "node model-server.js"。');
                                } else {
                                    console.error("调用本地翻译 API 失败:", error);
                                    vscode.window.showErrorMessage("本地翻译失败，请查看调试控制台获取详情。");
                                }
                            }
                            panel.webview.postMessage({
                                command: 'localTranslationResult',
                                id: message.id,
                                translation: translatedText
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
                        case 'applyAll':
                            const success = await applyAllTranslations(translationState, parsedTexts);
                            panel.webview.postMessage({ command: 'applyComplete' });
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

export function deactivate() {}
