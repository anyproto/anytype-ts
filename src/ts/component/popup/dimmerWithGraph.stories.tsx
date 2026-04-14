import type { Meta, StoryObj } from '@storybook/react';
import { withPopup } from '../../../../.storybook/decorators';
import DimmerWithGraph from './dimmerWithGraph';

const meta: Meta<typeof DimmerWithGraph> = {
	title: 'Popup/DimmerWithGraph',
	component: DimmerWithGraph,
	tags: ['autodocs'],
	decorators: [
		withPopup('DimmerWithGraph'),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onClick: () => {},
	},
};
