import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import IconObject from './iconObject';
import Theme from 'json/theme';
import * as I from 'Interface';

import './icons/object';
import './icons/type';
import './icons/default';
import './icons/relation';

import './iconObject.stories.scss';

const SIZES = [ 128, 96, 80, 64, 48, 40, 32, 30, 26, 22, 20, 18, 16 ];

const BORDER_RADIUS: Record<number, number> = {
	128: 24, 96: 20, 80: 16, 64: 16, 56: 8,
	48: 10, 44: 6, 42: 5, 40: 10,
	36: 4, 32: 8, 30: 6, 28: 4,
	26: 4, 24: 3, 22: 4,
	20: 4, 18: 2, 16: 2, 14: 2,
};

const ICON_BG_COLORS = Theme.icon.bg;
const ICON_COLOR_LIST = Theme.icon.list;

interface ObjectVariant {
	label: string;
	getObject: (size: number) => any;
};

const variants: ObjectVariant[] = [
	{
		label: 'Human (photo)',
		getObject: () => ({
			layout: I.ObjectLayout.Human,
			name: 'Christopher',
			iconImage: '',
		}),
	},
	{
		label: 'Human (letter)',
		getObject: () => ({
			layout: I.ObjectLayout.Human,
			name: 'Alexey',
		}),
	},
	{
		label: 'Type (icon)',
		getObject: () => ({
			layout: I.ObjectLayout.Type,
			name: 'Page',
			iconName: 'document-text',
			iconOption: 1,
		}),
	},
	{
		label: 'Type (colored)',
		getObject: () => ({
			layout: I.ObjectLayout.Type,
			name: 'Task',
			iconName: 'checkbox',
			iconOption: 4,
		}),
	},
	{
		label: 'Emoji',
		getObject: () => ({
			layout: I.ObjectLayout.Page,
			name: 'Banana',
			iconEmoji: '\uD83C\uDF4C',
		}),
	},
	{
		label: 'Page (default)',
		getObject: () => ({
			layout: I.ObjectLayout.Page,
			name: 'Untitled',
		}),
	},
	{
		label: 'Note (default)',
		getObject: () => ({
			layout: I.ObjectLayout.Note,
			name: 'Note',
		}),
	},
	{
		label: 'Task (unchecked)',
		getObject: () => ({
			layout: I.ObjectLayout.Task,
			name: 'Task',
			done: false,
		}),
	},
	{
		label: 'Task (done)',
		getObject: () => ({
			layout: I.ObjectLayout.Task,
			name: 'Task done',
			done: true,
		}),
	},
	{
		label: 'SpaceView',
		getObject: () => ({
			layout: I.ObjectLayout.SpaceView,
			name: 'My Space',
			iconOption: 7,
		}),
	},
	{
		label: 'Bookmark',
		getObject: () => ({
			layout: I.ObjectLayout.Bookmark,
			name: 'Bookmark',
		}),
	},
	{
		label: 'Relation',
		getObject: () => ({
			layout: I.ObjectLayout.Relation,
			name: 'Relation',
			relationFormat: I.RelationType.LongText,
			relationKey: 'description',
		}),
	},
	{
		label: 'File (PDF)',
		getObject: () => ({
			layout: I.ObjectLayout.Pdf,
			name: 'document.pdf',
			fileExt: 'pdf',
		}),
	},
	{
		label: 'File (archive)',
		getObject: () => ({
			layout: I.ObjectLayout.File,
			name: 'backup.zip',
			fileExt: 'zip',
		}),
	},
	{
		label: 'File (text)',
		getObject: () => ({
			layout: I.ObjectLayout.File,
			name: 'readme.txt',
			fileExt: 'txt',
		}),
	},
	{
		label: 'File (table)',
		getObject: () => ({
			layout: I.ObjectLayout.File,
			name: 'data.xlsx',
			fileExt: 'xlsx',
		}),
	},
	{
		label: 'File (present.)',
		getObject: () => ({
			layout: I.ObjectLayout.File,
			name: 'slides.pptx',
			fileExt: 'pptx',
		}),
	},
	{
		label: 'File (other)',
		getObject: () => ({
			layout: I.ObjectLayout.File,
			name: 'data.bin',
			fileExt: 'bin',
		}),
	},
	{
		label: 'Video',
		getObject: () => ({
			layout: I.ObjectLayout.Video,
			name: 'clip.mp4',
			fileExt: 'mp4',
		}),
	},
	{
		label: 'Audio',
		getObject: () => ({
			layout: I.ObjectLayout.Audio,
			name: 'track.mp3',
			fileExt: 'mp3',
		}),
	},
	{
		label: 'Image (no src)',
		getObject: () => ({
			layout: I.ObjectLayout.Image,
			name: 'photo.jpg',
			fileExt: 'jpg',
		}),
	},
];

const IconObjectGallery = () => {
	return (
		<div className="iconObjectGallery">
			<h2 className="iconObjectGalleryMainTitle">Object Icons</h2>

			{SIZES.map(size => {
				const r = BORDER_RADIUS[size] || 2;
				return (
					<div key={size} className="iconObjectGallerySection">
						<div className="iconObjectGallerySizeHeader">
							<span className="iconObjectGallerySize">{size}</span>
							<span className="iconObjectGalleryRadius">R={r}</span>
						</div>
						<div className="iconObjectGalleryRow">
							{variants.map((variant, i) => {
								const object = variant.getObject(size);
								return (
									<div key={i} className="iconObjectGalleryCell">
										<IconObject
											id={`icon-${size}-${i}`}
											size={size}
											object={object}
										/>
									</div>
								);
							})}
						</div>
						<div className="iconObjectGalleryLabels">
							{variants.map((variant, i) => (
								<span key={i} className="iconObjectGalleryLabel">{variant.label}</span>
							))}
						</div>
					</div>
				);
			})}

			<h2 className="iconObjectGalleryMainTitle">Icon Color Options</h2>
			<div className="iconObjectGalleryColorSection">
				{ICON_COLOR_LIST.map((colorName: string, index: number) => {
					const option = index + 1;
					const bgColor = ICON_BG_COLORS[colorName];
					return (
						<div key={colorName} className="iconObjectGalleryColorItem">
							<div className="iconObjectGalleryColorRow">
								<IconObject
									id={`color-type-${option}`}
									size={48}
									object={{
										layout: I.ObjectLayout.Type,
										name: colorName,
										iconName: 'document-text',
										iconOption: option,
									}}
								/>
								<IconObject
									id={`color-space-${option}`}
									size={48}
									object={{
										layout: I.ObjectLayout.SpaceView,
										name: colorName.charAt(0).toUpperCase() + colorName.slice(1),
										iconOption: option,
									}}
								/>
							</div>
							<span className="iconObjectGalleryColorLabel">
								{colorName}
								<span className="iconObjectGalleryColorHex">{bgColor}</span>
							</span>
						</div>
					);
				})}
			</div>

			<h2 className="iconObjectGalleryMainTitle">Layout Comparison at Size 48</h2>
			<div className="iconObjectGalleryLayoutGrid">
				{[
					{ name: 'Page', layout: I.ObjectLayout.Page, iconEmoji: '\uD83D\uDCDD' },
					{ name: 'Human', layout: I.ObjectLayout.Human },
					{ name: 'Task (unchecked)', layout: I.ObjectLayout.Task, done: false },
					{ name: 'Task (done)', layout: I.ObjectLayout.Task, done: true },
					{ name: 'Set', layout: I.ObjectLayout.Set },
					{ name: 'Collection', layout: I.ObjectLayout.Collection },
					{ name: 'Type', layout: I.ObjectLayout.Type, iconName: 'book', iconOption: 6 },
					{ name: 'Note', layout: I.ObjectLayout.Note },
					{ name: 'Bookmark', layout: I.ObjectLayout.Bookmark },
					{ name: 'SpaceView', layout: I.ObjectLayout.SpaceView, iconOption: 3 },
					{ name: 'Chat', layout: I.ObjectLayout.Chat },
					{ name: 'Date', layout: I.ObjectLayout.Date },
					{ name: 'Relation', layout: I.ObjectLayout.Relation, relationFormat: I.RelationType.Number, relationKey: 'number' },
					{ name: 'File', layout: I.ObjectLayout.File, fileExt: 'zip' },
					{ name: 'Pdf', layout: I.ObjectLayout.Pdf, fileExt: 'pdf' },
					{ name: 'Video', layout: I.ObjectLayout.Video, fileExt: 'mp4' },
					{ name: 'Audio', layout: I.ObjectLayout.Audio, fileExt: 'mp3' },
					{ name: 'Image (no src)', layout: I.ObjectLayout.Image, fileExt: 'jpg' },
				].map((obj, i) => (
					<div key={i} className="iconObjectGalleryLayoutItem">
						<IconObject
							id={`layout-${i}`}
							size={48}
							object={obj}
						/>
						<span className="iconObjectGalleryLabel">{obj.name}</span>
					</div>
				))}
			</div>
		</div>
	);
};

const meta: Meta = {
	title: 'Icons/ObjectIcons',
	component: IconObjectGallery,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {};
