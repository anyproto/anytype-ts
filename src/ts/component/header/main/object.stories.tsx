import type { Meta, StoryObj } from '@storybook/react';
import { withHeader } from '../../../../../.storybook/decorators';
import HeaderMainObject from './object';

const meta: Meta<typeof HeaderMainObject> = {
	title: 'Header/Main/Object',
	component: HeaderMainObject,
	tags: ['autodocs'],
	decorators: [ withHeader('mainObject') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
