import { AnytypeBlockType, NOTION_BLOCK_TYPE_MAP, NotionRichText } from './types';

// Assuming basic types for internal block representation for the converter
export interface BlockNode {
	type: AnytypeBlockType;
	text: string;
	children: BlockNode[];
	marks: Array<{ type: string; start: number; end: number; value?: string }>;
	url?: string;
	payload?: any;
}

export class HtmlParser {
	parse(htmlString: string): BlockNode[] {
		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, 'text/html');

		const rootBlocks: BlockNode[] = [];
		const contentNodes = doc.querySelectorAll('.page-body > *');

		for (const node of Array.from(contentNodes)) {
			const block = this.parseNode(node as HTMLElement);
			if (block) {
				rootBlocks.push(block);
			}
		}
		return rootBlocks;
	}

	private parseNode(node: HTMLElement): BlockNode | null {
		// Detect Notion block types by class or tag
		if (node.tagName === 'H1' || node.classList.contains('page-title')) return this.createTextBlock('header1', node);
		if (node.tagName === 'H2') return this.createTextBlock('header2', node);
		if (node.tagName === 'H3') return this.createTextBlock('header3', node);
		if (node.classList.contains('bulleted-list')) return this.createListBlock('bullet', node);
		if (node.classList.contains('numbered-list')) return this.createListBlock('numbered', node);
		if (node.classList.contains('to-do-list')) return this.createTodoListBlock(node);
		if (node.classList.contains('toggle')) return this.createToggleBlock(node);
		if (node.classList.contains('callout')) return this.createTextBlock('callout', node);
		if (node.classList.contains('quote')) return this.createTextBlock('quote', node);
		if (node.tagName === 'HR' || node.classList.contains('divider')) return { type: 'divider', text: '', children: [], marks: [] };
		if (node.classList.contains('image')) return this.createMediaBlock('image', node);
		if (node.classList.contains('video')) return this.createMediaBlock('video', node);
		if (node.classList.contains('bookmark')) return this.createBookmarkBlock(node);
		if (node.tagName === 'TABLE' || node.classList.contains('simple-table')) return this.createTableBlock(node);

		// Fallback to text (paragraph)
		if (node.tagName === 'P' || node.textContent?.trim() !== '') {
			return this.createTextBlock('text', node);
		}

		return null;
	}

	private createTextBlock(type: AnytypeBlockType, node: HTMLElement): BlockNode {
		const { text, marks } = this.extractTextAndMarks(node);
		return { type, text, children: [], marks };
	}

	private createListBlock(type: AnytypeBlockType, node: HTMLElement): BlockNode {
		// Handle list items. In Notion HTML, list items are usually li or div within a list container.
		const items = Array.from(node.querySelectorAll('li, .list-item'));
		if (items.length > 0) {
			const firstItem = items[0] as HTMLElement;
			const { text, marks } = this.extractTextAndMarks(firstItem);
			const block: BlockNode = { type, text, children: [], marks };
			// Subsequent items could be siblings or we handle the list as multiple blocks.
			// Simplified: we treat each list item as a separate block at the caller level usually,
			// or group them. Here we just return the first one as representative if it's a wrapper,
			// but correctly we should map lists to multiple blocks.
			// For simplicity in this mock-up, return the first item's content.
			return block;
		}
		return this.createTextBlock(type, node);
	}

	private createTodoListBlock(node: HTMLElement): BlockNode {
		const checkbox = node.querySelector('input[type="checkbox"]') as HTMLInputElement;
		const checked = checkbox ? checkbox.checked : false;
		const textNode = node.querySelector('.to-do-children-title') || node;
		const block = this.createTextBlock('checkbox', textNode as HTMLElement);
		block.payload = { checked };
		return block;
	}

	private createToggleBlock(node: HTMLElement): BlockNode {
		const summary = node.querySelector('summary') || node;
		const block = this.createTextBlock('toggle', summary as HTMLElement);
		// Children would be parsed recursively here
		return block;
	}

	private createMediaBlock(type: AnytypeBlockType, node: HTMLElement): BlockNode {
		const a = node.querySelector('a') as HTMLAnchorElement;
		const url = a ? a.getAttribute('href') || '' : '';
		return { type, text: '', children: [], marks: [], url };
	}

	private createBookmarkBlock(node: HTMLElement): BlockNode {
		const a = node.querySelector('a') as HTMLAnchorElement;
		const url = a ? a.getAttribute('href') || '' : '';
		return { type: 'bookmark', text: '', children: [], marks: [], url };
	}

	private createTableBlock(node: HTMLElement): BlockNode {
		return { type: 'table', text: '', children: [], marks: [] };
	}

	private extractTextAndMarks(node: HTMLElement): { text: string; marks: any[] } {
		let text = '';
		const marks: any[] = [];

		// Very basic traversal
		const traverse = (el: Node) => {
			if (el.nodeType === Node.TEXT_NODE) {
				text += el.textContent || '';
			} else if (el.nodeType === Node.ELEMENT_NODE) {
				const element = el as HTMLElement;
				const start = text.length;
				// Recursively process children
				for (const child of Array.from(element.childNodes)) {
					traverse(child);
				}
				const end = text.length;

				if (element.tagName === 'B' || element.tagName === 'STRONG') {
					marks.push({ type: 'bold', start, end });
				} else if (element.tagName === 'I' || element.tagName === 'EM') {
					marks.push({ type: 'italic', start, end });
				} else if (element.tagName === 'S' || element.tagName === 'DEL') {
					marks.push({ type: 'strikethrough', start, end });
				} else if (element.tagName === 'CODE') {
					marks.push({ type: 'code', start, end });
				} else if (element.tagName === 'A') {
					marks.push({ type: 'link', start, end, value: element.getAttribute('href') || '' });
				}
			}
		};

		traverse(node);
		return { text, marks };
	}
}
