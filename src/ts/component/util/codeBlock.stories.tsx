import type { Meta, StoryObj } from '@storybook/react';
import CodeBlock from './codeBlock';

const meta: Meta<typeof CodeBlock> = {
	title: 'Util/CodeBlock',
	component: CodeBlock,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const WithLanguage: Story = {
	args: {
		lang: 'typescript',
		text: 'const x: number = 1;\nfunction foo(n: number) {\n\treturn n * 2;\n}',
	},
};

export const Plain: Story = {
	args: {
		text: 'no language here\njust monospace text',
	},
};
