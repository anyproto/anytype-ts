import type { Meta, StoryObj } from '@storybook/react';
import { withHeader } from '../../../../.storybook/decorators';
import * as I from 'Interface';
import HeaderBanner from './banner';

const meta: Meta<typeof HeaderBanner> = {
	title: 'Header/Banner',
	component: HeaderBanner,
	tags: ['autodocs'],
	decorators: [ withHeader('banner') ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const IsArchived: Story = {
	args: {
		type: I.BannerType.IsArchived,
		object: { name: 'Test' },
	},
};

export const IsTemplate: Story = {
	args: {
		type: I.BannerType.IsTemplate,
		object: { name: 'Template' },
	},
};
