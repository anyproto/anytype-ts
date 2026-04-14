import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../.storybook/decorators';
import BlockRelation from './relation';
import * as I from 'Interface';
import * as M from 'Model';

const ROOT = 'sb-relation';

const makeBlock = (id: string, key: string) => new M.Block({
	id,
	type: I.BlockType.Relation,
	childrenIds: [],
	content: { key },
});

const meta: Meta<typeof BlockRelation> = {
	title: 'Block/Relation',
	component: BlockRelation,
	tags: ['autodocs'],
	decorators: [ withBlock('blockRelation') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rootId: ROOT,
		readonly: false,
		block: makeBlock('rel-default', 'name'),
	},
};
