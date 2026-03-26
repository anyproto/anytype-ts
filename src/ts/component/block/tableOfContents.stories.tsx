import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockTableOfContents from './tableOfContents';
import * as I from 'Interface';
import * as M from 'Model';

const makeBlock = (id: string) => new M.Block({
	id,
	type: I.BlockType.TableOfContents,
	content: {},
	childrenIds: [],
});

const mockBlock = makeBlock('toc-1');

const meta: Meta<typeof BlockTableOfContents> = {
	title: 'Block/TableOfContents',
	component: BlockTableOfContents,
	tags: ['autodocs'],
	decorators: [
		withBlock(U.Data.blockClass(mockBlock)),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
	args: {
		rootId: 'empty-root',
		block: mockBlock,
	},
};

export const WithHeadings: Story = {
	decorators: [
		(Story) => {
			const rootId = 'toc-root';

			// Mock getTableOfContents to return headings
			const original = S.Block.getTableOfContents;
			S.Block.getTableOfContents = (id: string) => {
				if (id === rootId) {
					return [
						{ id: 'h1', text: 'Introduction', depth: 0 },
						{ id: 'h2', text: 'Getting Started', depth: 0 },
						{ id: 'h3', text: 'Installation', depth: 1 },
						{ id: 'h4', text: 'Configuration', depth: 1 },
						{ id: 'h5', text: 'Advanced Usage', depth: 0 },
						{ id: 'h6', text: 'Plugins', depth: 1 },
						{ id: 'h7', text: 'Custom Themes', depth: 2 },
						{ id: 'h8', text: 'Troubleshooting', depth: 0 },
					];
				};
				return original.call(S.Block, id);
			};

			return <Story />;
		},
	],
	args: {
		rootId: 'toc-root',
		block: mockBlock,
	},
};
