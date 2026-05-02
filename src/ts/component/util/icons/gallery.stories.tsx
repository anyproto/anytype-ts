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
import './popup/header';
import './banner';
import './import';
import './counter';
import './plus';
import './block/embed';
import './menu/block/embed';
import './arrow';
import './menu/action';
import './menu/block/common';
import './menu/block/div';
import './menu/block/media';
import './menu/block/text';
import './menu/mark';
import './default';
import './menu/align/horizontal';
import './menu/align/vertical';
import './menu/common';
import './menu/inviteLink';
import './menu/linkStyle';
import './menu/relation';
import './menu/spaceCreate';
import './menu/table';
import './menu/help';
import './menu/widget';
import './menu/syncStatus';
import './sync';

import './gallery.stories.scss';

const FOLDER_SIZES: Record<string, number> = {
	state: 56,
	tier: 56,
	'dataview/view': 56,
	'popup/header': 56,
	'embed': 40,
};

const ICON_SIZES: Record<string, { size?: number; width?: number; height?: number }> = {
	'banner/smile': { width: 80, height: 40 },
	'import/csv': { size: 40 },
	'import/html': { size: 40 },
	'import/markdown': { size: 40 },
	'import/text': { size: 40 },
	'popup/header/anyId': { width: 60, height: 48 },
	'popup/header/emoji': { width: 60, height: 48 },
	'arrow/button': { size: 8 },
	'control/dataview/dnd': { width: 7, height: 12 },
	'plus/blockAdd': { size: 19 },
	'plus/onboarding': { size: 18 },
	'plus/table': { width: 11, height: 10 },
	'plus/widgetSection': { size: 12 },
	'plus/templateBig': { width: 24, height: 25 },
};

const IconGallery = () => {
	const folders = getIconsByFolder();

	return (
		<div className="iconGallery">
			{Array.from(folders.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([ folder, names ]) => (
				<div key={folder} className="iconGalleryFolder">
					<h3 className="iconGalleryTitle">{folder}</h3>
					<div className="iconGalleryGrid">
						{names.map((name) => {
							const label = name.split('/').pop();
							const iconSize = ICON_SIZES[name];
							const size = iconSize?.size || FOLDER_SIZES[folder];

							return (
								<div key={name} className="iconGalleryItem">
									<div className="iconGalleryPreview">
										<Icon name={name} size={size} width={iconSize?.width} height={iconSize?.height} />
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
