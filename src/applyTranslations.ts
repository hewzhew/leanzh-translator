import * as vscode from 'vscode';
import type { ParsedText } from './parser';

export async function applyAllTranslations(
    translationState: Map<number, { original: string, translation: string }>,
    parsedTexts: ParsedText[]
): Promise<boolean> {
    if (translationState.size === 0) {
        vscode.window.showInformationMessage('没有已保存的翻译可以应用。');
        return false;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('未找到活动编辑器。');
        return false;
    }

    const document = editor.document;
    let originalText = document.getText();

    // 按行号从后往前替换，避免位置错乱
    const sortedItems = Array.from(translationState.entries())
        .sort(([idA], [idB]) => (parsedTexts[idB].line ?? 0) - (parsedTexts[idA].line ?? 0));

    for (const [id, { original, translation }] of sortedItems) {
        // 用注释包裹原文，便于校对
        originalText = originalText.replace(original, `<!--\n${original}\n-->\n${translation}`);
    }

    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
    );

    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, fullRange, originalText);
    const success = await vscode.workspace.applyEdit(edit);

    if (success) {
        vscode.window.showInformationMessage(`成功应用了 ${translationState.size} 条翻译！`);
        translationState.clear();
    } else {
        vscode.window.showErrorMessage('应用翻译失败。');
    }
    return success;
}
