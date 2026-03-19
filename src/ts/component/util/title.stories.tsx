import type { Meta, StoryObj } from '@storybook/react';
import Title from './title';

const meta: Meta<typeof Title> = {
	title: 'Util/Title',
	component: Title,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: 'Page Title',
	},
};

export const HtmlContent: Story = {
	args: {
		text: 'Title with <b>bold</b> text',
	},
};

export const LongTitle: Story = {
	args: {
		text: 'This is a very long title that tests how the component handles extensive text content across multiple words',
	},
};

export const WithClassName: Story = {
	args: {
		text: 'Styled Title',
		className: 'customTitle',
	},
};
