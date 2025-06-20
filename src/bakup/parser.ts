import type { Root } from 'mdast';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

export interface ParsedText {
  text: string;
  type: string;
  line?: number;
  priority: number;
}

// toString 作为参数传入
export function parseMarkdown(content: string, toString: (node: any) => string): ParsedText[] {
  const processor = unified().use(remarkParse);
  const ast = processor.parse(content) as Root;

  const results: ParsedText[] = [];
  const seen = new Set<string>();

  for (const node of ast.children) {
    if (node.type === 'code') {
      continue;
    }

    let parsedText: ParsedText | null = null;

    switch (node.type) {
      case 'heading':
        parsedText = {
          text: toString(node).trim(),
          type: `标题${node.depth}`,
          line: node.position?.start.line,
          priority: 10 - (node.depth as number),
        };
        break;

      case 'paragraph':
        parsedText = {
          text: toString(node).trim(),
          type: '段落',
          line: node.position?.start.line,
          priority: 5,
        };
        break;

      case 'list':
        for (const listItem of (node.children || [])) {
          const itemText = toString(listItem).trim();
          if (itemText && !seen.has(itemText)) {
            results.push({
              text: itemText,
              type: '列表项',
              line: listItem.position?.start.line,
              priority: 4,
            });
            seen.add(itemText);
          }
        }
        break;

      case 'blockquote':
        parsedText = {
          text: toString(node).trim(),
          type: '引用',
          line: node.position?.start.line,
          priority: 3,
        };
        break;
    }

    if (parsedText && parsedText.text && !seen.has(parsedText.text)) {
      results.push(parsedText);
      seen.add(parsedText.text);
    }
  }

  return results.sort((a, b) => b.priority - a.priority);
}
