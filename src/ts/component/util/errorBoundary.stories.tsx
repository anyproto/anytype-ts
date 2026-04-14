import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ErrorBoundary from './errorBoundary';

const ThrowError = ({ message }: { message: string }) => {
	throw new Error(message);
};

const meta: Meta<typeof ErrorBoundary> = {
	title: 'Util/ErrorBoundary',
	component: ErrorBoundary,
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const WithError: Story = {
	render: () => (
		<ErrorBoundary>
			<ThrowError message="Something went wrong in the component" />
		</ErrorBoundary>
	),
};

export const WithStackTrace: Story = {
	render: () => {
		const ThrowWithStack = () => {
			const error = new Error('TypeError: Cannot read properties of undefined');
			error.stack = `TypeError: Cannot read properties of undefined
    at Component (src/ts/component/block/text.tsx:42:15)
    at renderWithHooks (react-dom.development.js:14985:18)
    at mountIndeterminateComponent (react-dom.development.js:17811:13)`;
			throw error;
		};

		return (
			<ErrorBoundary>
				<ThrowWithStack />
			</ErrorBoundary>
		);
	},
};

export const NoError: Story = {
	render: () => (
		<ErrorBoundary>
			<div style={{ padding: 16 }}>This content renders normally</div>
		</ErrorBoundary>
	),
};
