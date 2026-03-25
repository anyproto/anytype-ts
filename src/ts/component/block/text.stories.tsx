import type { Meta, StoryObj } from '@storybook/react';
import { I } from 'Lib';
import { withBlock } from '../../../../.storybook/decorators';
import BlockText from './text';

const meta: Meta<typeof BlockText> = {
	title: 'Block/Text',
	component: BlockText,
	tags: ['autodocs'],
	decorators: [ withBlock('blockText textParagraph') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const makeBlock = (id: string, style: I.TextStyle, text: string, extra: any = {}) => ({
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

export const Paragraph: Story = {
	args: {
		rootId: 'root',
		block: makeBlock('text-paragraph', I.TextStyle.Paragraph, 'The quick brown fox jumps over the lazy dog.'),
	},
};

export const Header1: Story = {
	decorators: [ withBlock('blockText textHeader1') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-header1', I.TextStyle.Header1, 'Header Level 1'),
	},
};

export const Header2: Story = {
	decorators: [ withBlock('blockText textHeader2') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-header2', I.TextStyle.Header2, 'Header Level 2'),
	},
};

export const Header3: Story = {
	decorators: [ withBlock('blockText textHeader3') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-header3', I.TextStyle.Header3, 'Header Level 3'),
	},
};

export const Quote: Story = {
	decorators: [ withBlock('blockText textQuote') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-quote', I.TextStyle.Quote, 'The only way to do great work is to love what you do.'),
	},
};

export const Code: Story = {
	decorators: [ withBlock('blockText textCode') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-code', I.TextStyle.Code, 'const greeting = "Hello, world!";'),
	},
};

export const Checkbox: Story = {
	decorators: [ withBlock('blockText textCheckbox') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-checkbox', I.TextStyle.Checkbox, 'Unchecked task item'),
	},
};

export const CheckboxChecked: Story = {
	decorators: [ withBlock('blockText textCheckbox isChecked') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-checkbox-checked', I.TextStyle.Checkbox, 'Completed task item', { checked: true }),
	},
};

export const Bulleted: Story = {
	decorators: [ withBlock('blockText textBulleted') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-bulleted', I.TextStyle.Bulleted, 'Bulleted list item'),
	},
};

export const Numbered: Story = {
	decorators: [ withBlock('blockText textNumbered') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-numbered', I.TextStyle.Numbered, 'Numbered list item'),
	},
};

export const Toggle: Story = {
	decorators: [ withBlock('blockText textToggle') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-toggle', I.TextStyle.Toggle, 'Toggle content block'),
	},
};

export const Callout: Story = {
	decorators: [ withBlock('blockText textCallout') ],
	args: {
		rootId: 'root',
		block: makeBlock('text-callout', I.TextStyle.Callout, 'This is a callout block for important information.'),
	},
};
