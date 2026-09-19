type CodeBlock = Pick<HTMLPreElement, 'querySelector' | 'textContent'>;

export function getCodeBlockText(block: CodeBlock) {
  return block.querySelector('code')?.textContent ?? block.textContent ?? '';
}
