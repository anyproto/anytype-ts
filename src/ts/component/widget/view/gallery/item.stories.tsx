import type { Meta, StoryObj } from '@storybook/react';
import WidgetGalleryItem from './item';

const meta: Meta<typeof WidgetGalleryItem> = {
	title: 'Widget/View/Gallery/Item',
	component: WidgetGalleryItem,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
