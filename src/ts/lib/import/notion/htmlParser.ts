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
		const items = Array.from(node.querySelectorAll('li, .list-item'));
		const parentBlock: BlockNode = { type, text: '', children: [], marks: [] };

		if (items.length > 0) {
			for (const item of items) {
				const { text, marks } = this.extractTextAndMarks(item as HTMLElement);
				parentBlock.children.push({ type: 'text', text, children: [], marks });
			}
		} else {
			const { text, marks } = this.extractTextAndMarks(node);
			parentBlock.text = text;
			parentBlock.marks = marks;
		}

		return parentBlock;
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

		// Parse children
		const childNodes = Array.from(node.children).filter(el => el.tagName !== 'SUMMARY');
		for (const child of childNodes) {
			const parsedChild = this.parseNode(child as HTMLElement);
			if (parsedChild) block.children.push(parsedChild);
		}

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
		const block: BlockNode = { type: 'table', text: '', children: [], marks: [] };

		const rows = node.querySelectorAll('tr');
		for (const row of Array.from(rows)) {
			const rowBlock: BlockNode = { type: 'tableRow', text: '', children: [], marks: [] };

			const cells = row.querySelectorAll('td, th');
			for (const cell of Array.from(cells)) {
				const { text, marks } = this.extractTextAndMarks(cell as HTMLElement);
				rowBlock.children.push({ type: 'text', text, children: [], marks }); // Simulate table cell
			}

			block.children.push(rowBlock);
		}

		return block;
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
