import type { Meta, StoryObj } from '@storybook/react';
import { withPopup } from '../../../../../.storybook/decorators';
import OnboardingGraphWorker from './OnboardingGraphWorker';

const meta: Meta<typeof OnboardingGraphWorker> = {
	title: 'Popup/Graph/OnboardingGraphWorker',
	component: OnboardingGraphWorker,
	tags: ['autodocs'],
	decorators: [
		withPopup('OnboardingGraphWorker'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		width: 720,
		height: 480,
	},
};
