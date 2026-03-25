import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { I, S } from 'Lib';
import BlockText from './text';
import BlockDiv from './div';
import BlockBookmark from './bookmark';
import BlockLink from './link';
import BlockTableOfContents from './tableOfContents';
import BlockFile from './media/file';
import BlockImage from './media/image';
import BlockAudio from './media/audio';
import BlockVideo from './media/video';
import BlockPdf from './media/pdf';

const meta: Meta = {
	title: 'Block/Gallery',
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const ROOT = 'sb-gallery';

const makeTextBlock = (id: string, style: I.TextStyle, text: string, extra: any = {}) => ({
	id,
	type: I.BlockType.Text,
	childrenIds: [],
	fields: {},
	content: {
		text,
		marks: [],
		style,
		checked: extra.checked ?? false,
		color: extra.color || '',
		iconEmoji: extra.iconEmoji || '',
		iconImage: extra.iconImage || '',
	},
});

const makeDivBlock = (id: string, style: I.DivStyle) => ({
	id,
	type: I.BlockType.Div,
	childrenIds: [],
	fields: {},
	content: { style },
});

const makeBookmarkBlock = (id: string, targetObjectId: string) => ({
	id,
	type: I.BlockType.Bookmark,
	childrenIds: [],
	fields: {},
	bgColor: '',
	content: {
		state: I.BookmarkState.Done,
		targetObjectId,
		url: 'https://anytype.io',
	},
});

const makeLinkBlock = (id: string, targetBlockId: string) => ({
	id,
	type: I.BlockType.Link,
	childrenIds: [],
	fields: {},
	bgColor: '',
	content: {
		targetBlockId,
		cardStyle: I.LinkCardStyle.Text,
		iconSize: I.LinkIconSize.Small,
		description: I.LinkDescription.None,
		relations: [],
	},
	getTargetObjectId: () => targetBlockId,
});

const makeTocBlock = (id: string) => ({
	id,
	type: I.BlockType.TableOfContents,
	childrenIds: [],
	fields: {},
	content: {},
});

const makeFileBlock = (id: string, type: I.FileType) => ({
	id,
	type: I.BlockType.File,
	childrenIds: [],
	fields: {},
	content: {
		state: I.FileState.Empty,
		style: I.FileStyle.Auto,
		type,
		targetObjectId: '',
	},
});

const textStyleMap: { style: I.TextStyle; label: string; text: string; blockClass: string; extra?: any }[] = [
	{ style: I.TextStyle.Paragraph, label: 'Paragraph', text: 'The quick brown fox jumps over the lazy dog.', blockClass: 'blockText textParagraph' },
	{ style: I.TextStyle.Header1, label: 'Header1', text: 'Header Level 1', blockClass: 'blockText textHeader1' },
	{ style: I.TextStyle.Header2, label: 'Header2', text: 'Header Level 2', blockClass: 'blockText textHeader2' },
	{ style: I.TextStyle.Header3, label: 'Header3', text: 'Header Level 3', blockClass: 'blockText textHeader3' },
	{ style: I.TextStyle.Quote, label: 'Quote', text: 'The only way to do great work is to love what you do.', blockClass: 'blockText textQuote' },
	{ style: I.TextStyle.Code, label: 'Code', text: 'const greeting = "Hello, world!";', blockClass: 'blockText textCode' },
	{ style: I.TextStyle.Checkbox, label: 'Checkbox', text: 'Unchecked task item', blockClass: 'blockText textCheckbox' },
	{ style: I.TextStyle.Bulleted, label: 'Bulleted', text: 'Bulleted list item', blockClass: 'blockText textBulleted' },
	{ style: I.TextStyle.Numbered, label: 'Numbered', text: 'Numbered list item', blockClass: 'blockText textNumbered' },
	{ style: I.TextStyle.Callout, label: 'Callout', text: 'This is a callout block for important information.', blockClass: 'blockText textCallout' },
];

const sectionHeadingStyle = { margin: '24px 0 8px', color: 'var(--color-text-secondary)' };

export const AllBlocks: Story = {
	render: () => {
		// Setup mock data for bookmark and link
		S.Detail.update(ROOT, { id: 'gallery-bm-target', details: {
			name: 'Anytype -- the everything app',
			description: 'Build apps, docs, and workflows. Own your data.',
			source: 'https://anytype.io',
			picture: '',
			iconImage: '',
		}}, false);

		S.Detail.update(ROOT, { id: 'gallery-link-target', details: {
			name: 'My Linked Document',
			layout: I.ObjectLayout.Page,
			type: 'type-page',
		}}, false);

		// Mock getTableOfContents for the TOC block
		const original = S.Block.getTableOfContents;
		S.Block.getTableOfContents = (id: string) => {
			if (id === ROOT) {
				return [
					{ id: 'h1', text: 'Introduction', depth: 0 },
					{ id: 'h2', text: 'Getting Started', depth: 0 },
					{ id: 'h3', text: 'Installation', depth: 1 },
				];
			}
			return original.call(S.Block, id);
		};

		return (
			<div className="blocks" style={{ padding: 16, maxWidth: 700 }}>
				<h3 style={sectionHeadingStyle}>Text Blocks</h3>
				{textStyleMap.map(({ style, label, text, blockClass }) => (
					<div key={label} className={`block ${blockClass} align0`}>
						<div className="wrapMenu" />
						<div className="wrapContent">
							<BlockText
								rootId={ROOT}
								block={makeTextBlock(`gallery-text-${label}`, style, text)}
							/>
						</div>
					</div>
				))}

				<h3 style={sectionHeadingStyle}>Dividers</h3>
				<div className="block blockDiv align0">
					<div className="wrapMenu" />
					<div className="wrapContent">
						<BlockDiv
							rootId={ROOT}
							block={makeDivBlock('gallery-div-line', I.DivStyle.Line)}
						/>
					</div>
				</div>
				<div className="block blockDiv align0">
					<div className="wrapMenu" />
					<div className="wrapContent">
						<BlockDiv
							rootId={ROOT}
							block={makeDivBlock('gallery-div-dots', I.DivStyle.Dot)}
						/>
					</div>
				</div>

				<h3 style={sectionHeadingStyle}>Bookmark</h3>
				<div className="block blockBookmark align0">
					<div className="wrapMenu" />
					<div className="wrapContent">
						<BlockBookmark
							rootId={ROOT}
							block={makeBookmarkBlock('gallery-bookmark', 'gallery-bm-target')}
							getWrapperWidth={() => 600}
						/>
					</div>
				</div>

				<h3 style={sectionHeadingStyle}>Link</h3>
				<div className="block blockLink align0">
					<div className="wrapMenu" />
					<div className="wrapContent">
						<BlockLink
							rootId={ROOT}
							block={makeLinkBlock('gallery-link', 'gallery-link-target')}
							getWrapperWidth={() => 600}
						/>
					</div>
				</div>

				<h3 style={sectionHeadingStyle}>Table of Contents</h3>
				<div className="block blockTableOfContents align0">
					<div className="wrapMenu" />
					<div className="wrapContent">
						<BlockTableOfContents
							rootId={ROOT}
							block={makeTocBlock('gallery-toc')}
						/>
					</div>
				</div>

				<h3 style={sectionHeadingStyle}>Media Blocks</h3>
				<div className="block blockFile align0">
					<div className="wrapMenu" />
					<div className="wrapContent">
						<BlockFile
							rootId={ROOT}
							block={makeFileBlock('gallery-file', I.FileType.File)}
						/>
					</div>
				</div>
				<div className="block blockImage align0">
					<div className="wrapMenu" />
					<div className="wrapContent">
						<BlockImage
							rootId={ROOT}
							block={makeFileBlock('gallery-image', I.FileType.Image)}
						/>
					</div>
				</div>
				<div className="block blockAudio align0">
					<div className="wrapMenu" />
					<div className="wrapContent">
						<BlockAudio
							rootId={ROOT}
							block={makeFileBlock('gallery-audio', I.FileType.Audio)}
						/>
					</div>
				</div>
				<div className="block blockVideo align0">
					<div className="wrapMenu" />
					<div className="wrapContent">
						<BlockVideo
							rootId={ROOT}
							block={makeFileBlock('gallery-video', I.FileType.Video)}
						/>
					</div>
				</div>
				<div className="block blockPdf align0">
					<div className="wrapMenu" />
					<div className="wrapContent">
						<BlockPdf
							rootId={ROOT}
							block={makeFileBlock('gallery-pdf', I.FileType.Pdf)}
						/>
					</div>
				</div>
			</div>
		);
	},
};
