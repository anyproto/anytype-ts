import type { Meta, StoryObj } from '@storybook/react';
import { withWidget } from '../../../../.storybook/decorators';
import WidgetObject from './object';

const meta: Meta<typeof WidgetObject> = {
	title: 'Widget/Object',
	component: WidgetObject,
	tags: ['autodocs'],
	decorators: [
		withWidget('widgetObject'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		parent: { id: 'storybook-widget-object' } as any,
		onContext: () => {},
	},
};
