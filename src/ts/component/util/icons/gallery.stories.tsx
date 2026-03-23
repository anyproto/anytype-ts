import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { getIconsByFolder } from './registry';
import Icon from '../icon';
import './header';
import './control/editor';
import './control/audio';
import './common';
import './emoji';
import './marker';
import './filterTemplate';
import './relation';
import './publish';
import './state';
import './chat/empty';
import './layout';
import './membership';
import './tier';
import './dataview/view';
import './control/dataview';
import './control/cover';

import './gallery.stories.scss';

const FOLDER_SIZES: Record<string, number> = {
	state: 56,
	tier: 120,
	'dataview/view': 56,
};

const IconGallery = () => {
	const folders = getIconsByFolder();

	return (
		<div className="iconGallery">
			{Array.from(folders.entries()).map(([ folder, names ]) => (
				<div key={folder} className="iconGalleryFolder">
					<h3 className="iconGalleryTitle">{folder}</h3>
					<div className="iconGalleryGrid">
						{names.map((name) => {
							const label = name.split('/').pop();
							const size = FOLDER_SIZES[folder];

							return (
								<div key={name} className="iconGalleryItem">
									<div className="iconGalleryPreview">
										<Icon name={name} size={size} />
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
