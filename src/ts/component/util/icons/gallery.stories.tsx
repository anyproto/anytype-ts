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
import './void';
import './layout';

import './gallery.stories.scss';

const IconGallery = () => {
	const folders = getIconsByFolder();

	return (
		<div className="iconGallery">
			{Array.from(folders.entries()).map(([ folder, names ]) => (
				<div key={folder} className="iconGalleryFolder">
					<h3 className="iconGalleryTitle">{folder}</h3>
					<div className="iconGalleryGrid">
						{names.map((name) => {
							const SvgComponent = getIcon(name);

							if (!SvgComponent) {
								return null;
							};

							const label = name.split('/').pop();

							return (
								<div key={name} className="iconGalleryItem">
									<div className="iconGalleryPreview">
										<SvgComponent />
									</div>
									<span className="iconGalleryLabel">{label}</span>
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
