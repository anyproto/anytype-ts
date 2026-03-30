import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockText from './text';
import * as I from 'Interface';
import * as M from 'Model';

const meta: Meta<typeof BlockText> = {
	title: 'Block/Text',
	component: BlockText,
	tags: ['autodocs'],
	decorators: [ withBlock('blockText textParagraph') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const makeBlock = (id: string, style: I.TextStyle, text: string, extra: any = {}) => new M.Block({
	id,
	type: I.BlockType.Text,
	childrenIds: [],
	fields: {},
	content: {
		text,
		marks: [],
		style,
		checked: extra.checked ?? false,
		color: extra.color || '',
		iconEmoji: extra.iconEmoji || '',
		iconImage: extra.iconImage || '',
	},
});

const textBlock = (style: I.TextStyle, extra?: string) => {
	const cn = [ U.Data.blockClass(makeBlock('_', style, '')) ];
	if (extra) {
		cn.push(extra);
	};
	return withBlock(cn.join(' '));
};

export const Paragraph: Story = {
	args: {
		rootId: 'root',
		block: makeBlock('text-paragraph', I.TextStyle.Paragraph, 'The quick brown fox jumps over the lazy dog.'),
	},
};

export const Header1: Story = {
	decorators: [ textBlock(I.TextStyle.Header1) ],
	args: {
		rootId: 'root',
		block: makeBlock('text-header1', I.TextStyle.Header1, 'Header Level 1'),
	},
};

export const Header2: Story = {
	decorators: [ textBlock(I.TextStyle.Header2) ],
	args: {
		rootId: 'root',
		block: makeBlock('text-header2', I.TextStyle.Header2, 'Header Level 2'),
	},
};

export const Header3: Story = {
	decorators: [ textBlock(I.TextStyle.Header3) ],
	args: {
		rootId: 'root',
		block: makeBlock('text-header3', I.TextStyle.Header3, 'Header Level 3'),
	},
};

export const Quote: Story = {
	decorators: [ textBlock(I.TextStyle.Quote) ],
	args: {
		rootId: 'root',
		block: makeBlock('text-quote', I.TextStyle.Quote, 'The only way to do great work is to love what you do.'),
	},
};

export const Code: Story = {
	decorators: [ textBlock(I.TextStyle.Code) ],
	args: {
		rootId: 'root',
		block: makeBlock('text-code', I.TextStyle.Code, 'const greeting = "Hello, world!";'),
	},
};

export const Checkbox: Story = {
	decorators: [ textBlock(I.TextStyle.Checkbox) ],
	args: {
		rootId: 'root',
		block: makeBlock('text-checkbox', I.TextStyle.Checkbox, 'Unchecked task item'),
	},
};

export const CheckboxChecked: Story = {
	decorators: [ textBlock(I.TextStyle.Checkbox, 'isChecked') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-checkbox-checked', I.TextStyle.Checkbox, 'Completed task item', { checked: true }),
	},
};

export const Bulleted: Story = {
	decorators: [ textBlock(I.TextStyle.Bulleted) ],
	args: {
		rootId: 'root',
		block: makeBlock('text-bulleted', I.TextStyle.Bulleted, 'Bulleted list item'),
	},
};

export const Numbered: Story = {
	decorators: [ textBlock(I.TextStyle.Numbered) ],
	args: {
		rootId: 'root',
		block: makeBlock('text-numbered', I.TextStyle.Numbered, 'Numbered list item'),
	},
};

export const Toggle: Story = {
	decorators: [ textBlock(I.TextStyle.Toggle) ],
	args: {
		rootId: 'root',
		block: makeBlock('text-toggle', I.TextStyle.Toggle, 'Toggle content block'),
	},
};

export const Callout: Story = {
	decorators: [ textBlock(I.TextStyle.Callout) ],
	args: {
		rootId: 'root',
		block: makeBlock('text-callout', I.TextStyle.Callout, 'This is a callout block for important information.'),
	},
};
