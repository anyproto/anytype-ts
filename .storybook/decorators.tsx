import React from 'react';
import type { Decorator } from '@storybook/react';

/**
 * Decorator that wraps stories in a container with standard padding.
 * Useful for components that need some breathing room.
 */
export const withContainer: Decorator = (Story, context) => {
	const { width, padding } = context.parameters.container || {};

	return (
		<div style={{
			width: width || 'auto',
			padding: padding ?? 16,
		}}>
			<Story />
		</div>
	);
};

/**
 * Decorator that provides a dark background option for components.
 */
export const withBackground: Decorator = (Story, context) => {
	const bg = context.parameters.background || 'transparent';

	return (
		<div style={{ background: bg, padding: 16, borderRadius: 8 }}>
			<Story />
		</div>
	);
};
