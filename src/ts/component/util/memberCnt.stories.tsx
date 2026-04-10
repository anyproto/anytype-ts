import type { Meta, StoryObj } from '@storybook/react';
import MemberCnt from './memberCnt';

const meta: Meta<typeof MemberCnt> = {
	title: 'Util/MemberCnt',
	component: MemberCnt,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		route: 'settings',
	},
};

export const WidgetRoute: Story = {
	args: {
		route: 'widget',
	},
};
