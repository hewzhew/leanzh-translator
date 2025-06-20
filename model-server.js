import express from 'express';
import { pipeline, env } from '@xenova/transformers';

// 设置 HuggingFace 镜像源
console.log('正在设置远程主机为镜像服务器: https://hf-mirror.com');
env.remoteHost = 'https://hf-mirror.com';

// 翻译 Pipeline 管理类
class TranslationPipeline {
  static task = 'translation_en_to_zh';
  static model = 'Xenova/opus-mt-en-zh';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      console.log(`正在从网络加载翻译模型: ${this.model}`);
      this.instance = await pipeline(this.task, this.model, { progress_callback });
      console.log('翻译模型加载并初始化完成！');
    }
    return this.instance;
  }
}

// 使用 express 创建服务器
const app = express();
const hostname = '127.0.0.1';
const port = 3000;

// 自动解析 JSON 请求体
app.use(express.json());

// 处理 POST /translate
app.post('/translate', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: '无效请求。请在 JSON 请求体中提供 text 字段。' });
    return;
  }
  try {
    const translator = await TranslationPipeline.getInstance();
    const translationResult = await translator(text);
    const translatedText = translationResult[0].translation_text;
    console.log(`翻译成功: "${text}" -> "${translatedText}"`);
    res.status(200).json({ translation_text: translatedText });
  } catch (error) {
    console.error('在处理翻译请求时出错:', error);
    res.status(500).json({ error: '翻译过程中服务器内部错误。' });
  }
});

// 启动服务器
app.listen(port, hostname, () => {
  console.log(`翻译服务器正在运行于 http://${hostname}:${port}/`);
  console.log(`请通过 POST http://127.0.0.1:3000/translate 测试，body: { "text": "Hello world" }`);
  // 启动时预加载模型
  TranslationPipeline.getInstance();
});