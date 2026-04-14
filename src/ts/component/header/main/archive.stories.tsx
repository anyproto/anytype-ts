import type { Meta, StoryObj } from '@storybook/react';
import { withHeader } from '../../../../../.storybook/decorators';
import HeaderMainArchive from './archive';

const meta: Meta<typeof HeaderMainArchive> = {
	title: 'Header/Main/Archive',
	component: HeaderMainArchive,
	tags: ['autodocs'],
	decorators: [ withHeader('mainArchive') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		renderLeftIcons: () => null,
		menuOpen: () => {},
		isPopup: false,
	},
};
