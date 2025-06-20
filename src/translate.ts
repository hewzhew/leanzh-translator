import OpenAI from 'openai';

export async function translateText(text: string, apiKey: string): Promise<string> {
    if (!apiKey) {
        return "翻译失败：尚未在 VS Code 设置中配置 DeepSeek API Key。";
    }

    const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: apiKey,
    });

    const prompt = `你是一个专业的科技文档翻译引擎。
请将用户提供的以下 Markdown 文本段落从英文翻译成中文。
要求：
- 保持原文的格式、标点和换行。
- 专业术语翻译要准确。
- 风格要自然流畅，符合中文技术文档的阅读习惯。
- 不要添加任何与翻译无关的额外解释或说明，直接返回翻译后的文本。`;

    try {
        const completion = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: text }
            ],
            stream: false,
        });

        const translatedContent = completion.choices[0]?.message?.content;

        if (translatedContent) {
            return translatedContent.trim();
        } else {
            return "翻译失败：API 返回了空内容。";
        }

    } catch (error) {
        console.error("DeepSeek API 调用失败:", error);
        if (error instanceof Error) {
            return `翻译失败: ${error.message}`;
        }
        return `翻译失败: ${String(error)}`;
    }
}
