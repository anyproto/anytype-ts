import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockEmbed from './embed';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-embed';

const meta: Meta<typeof BlockEmbed> = {
	title: 'Block/Embed',
	component: BlockEmbed,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const makeBlock = (id: string, processor: number, text: string, width = 1) => new M.Block({
	id,
	type: I.BlockType.Embed,
	content: { processor, text },
	childrenIds: [],
	fields: { width },
	bgColor: '',
	hAlign: 0,
});

const embedBlock = (processor: number) => withBlock(U.Data.blockClass(makeBlock('_', processor, '')));

export const Latex: Story = {
	decorators: [ embedBlock(I.EmbedProcessor.Latex) ],
	args: {
		rootId: ROOT,
		readonly: true,
		block: makeBlock('embed-latex', I.EmbedProcessor.Latex, 'E = mc^2'),
	},
};

export const LatexEquation: Story = {
	decorators: [ embedBlock(I.EmbedProcessor.Latex) ],
	args: {
		rootId: ROOT,
		readonly: true,
		block: makeBlock('embed-latex2', I.EmbedProcessor.Latex, '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}'),
	},
};

export const Mermaid: Story = {
	decorators: [ embedBlock(I.EmbedProcessor.Mermaid) ],
	args: {
		rootId: ROOT,
		readonly: true,
		block: makeBlock('embed-mermaid', I.EmbedProcessor.Mermaid, 'graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Do something]\n  B -->|No| D[Do something else]\n  C --> E[End]\n  D --> E'),
	},
};

export const MermaidSequence: Story = {
	decorators: [ embedBlock(I.EmbedProcessor.Mermaid) ],
	args: {
		rootId: ROOT,
		readonly: true,
		block: makeBlock('embed-seq', I.EmbedProcessor.Mermaid, 'sequenceDiagram\n  Alice->>Bob: Hello Bob\n  Bob-->>Alice: Hi Alice\n  Alice->>Bob: How are you?\n  Bob-->>Alice: Fine, thanks!'),
	},
};
