import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MediaPdf from './pdf';

const meta: Meta<typeof MediaPdf> = {
	title: 'Util/Media/Pdf',
	component: MediaPdf,
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div style={{ width: 600, minHeight: 400 }}>
				<Story />
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		src: 'https://example.com/document.pdf',
		page: 1,
		onDocumentLoad: () => {},
		onPageRender: () => {},
		onClick: () => {},
	},
};

export const SecondPage: Story = {
	args: {
		src: 'https://example.com/document.pdf',
		page: 2,
		onDocumentLoad: () => {},
		onPageRender: () => {},
		onClick: () => {},
	},
};
