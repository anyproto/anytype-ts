import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import UpdateBanner from './updateBanner';

const meta: Meta<typeof UpdateBanner> = {
	title: 'Util/UpdateBanner',
	component: UpdateBanner,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ position: 'relative', width: '100%', minHeight: 100 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	decorators: [
		(Story) => {
			S.Common.updateVersionSet('0.45.0');
			return <Story />;
		},
	],
};

export const BetaVersion: Story = {
	decorators: [
		(Story) => {
			S.Common.updateVersionSet('0.46.0-beta.1');
			return <Story />;
		},
	],
};
