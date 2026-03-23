import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { getIconsByFolder, getIcon } from './registry';
import './header';
import './control/editor';
import './control/audio';
import './common';
import './emoji';
import './marker';
import './filterTemplate';
import './relation';
import './publish';

const IconGallery = () => {
	const folders = getIconsByFolder();

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 20, overflow: 'auto', height: '100vh' }}>
			{Array.from(folders.entries()).map(([ folder, names ]) => (
				<div key={folder}>
					<h3 style={{ margin: '0 0 12px', fontWeight: 600 }}>{folder}</h3>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
						{names.map((name) => {
							const SvgComponent = getIcon(name);

							if (!SvgComponent) {
								return null;
							};

							const label = name.split('/').pop();

							return (
								<div
									key={name}
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										gap: 6,
										padding: 8,
										borderRadius: 8,
										minWidth: 72,
									}}
								>
									<div
										style={{
											width: 28,
											height: 28,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											borderRadius: 6,
											color: 'var(--color-icon, #9b9b9b)',
										}}
									>
										<SvgComponent />
									</div>
									<span style={{ fontSize: 11, color: '#888', textAlign: 'center' }}>{label}</span>
								</div>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
};

const meta: Meta = {
	title: 'Icons/Gallery',
	component: IconGallery,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {};
