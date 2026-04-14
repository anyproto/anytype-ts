import type { Meta, StoryObj } from '@storybook/react';
import { withWidgetView } from '../../../../../../.storybook/decorators';
import WidgetGalleryItem from './item';

const meta: Meta<typeof WidgetGalleryItem> = {
	title: 'Widget/View/Gallery/Item',
	component: WidgetGalleryItem,
	tags: ['autodocs'],
	decorators: [
		withWidgetView('viewGallery'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		subId: 'storybook-gallery-sub',
		id: 'storybook-gallery-item',
		block: { id: 'storybook-block' } as any,
		getView: () => ({} as any),
		onResize: () => {},
	},
};

export const WithIcon: Story = {
	args: {
		...Default.args,
		hideIcon: false,
	},
};

export const HiddenIcon: Story = {
	args: {
		...Default.args,
		hideIcon: true,
	},
};
