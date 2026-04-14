import type { Meta, StoryObj } from '@storybook/react';
import { withWidget } from '../../../../.storybook/decorators';
import WidgetSpace from './space';

const meta: Meta<typeof WidgetSpace> = {
	title: 'Widget/Space',
	component: WidgetSpace,
	tags: ['autodocs'],
	decorators: [
		withWidget('widgetSpace'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		parent: { id: 'storybook-widget-space' } as any,
		onContext: () => {},
	},
};
