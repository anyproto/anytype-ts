import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import ContentIcon from './icon';

import '../../util/icons/object';
import '../../util/icons/default';

const meta: Meta<typeof ContentIcon> = {
	title: 'Block/Help/ContentIcon',
	component: ContentIcon,
	tags: ['autodocs'],
	decorators: [ withBlock('blockHelp') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Rocket: Story = {
	args: {
		icon: '\uD83D\uDE80',
	},
};

export const Star: Story = {
	args: {
		icon: '\u2B50',
	},
};

export const Banana: Story = {
	args: {
		icon: '\uD83C\uDF4C',
	},
};

export const NoIcon: Story = {
	args: {
		icon: '',
	},
};
