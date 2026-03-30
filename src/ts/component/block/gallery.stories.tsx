import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
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
import * as I from 'Interface';
import * as M from 'Model';

const meta: Meta = {
	title: 'Block/Gallery',
	tags: ['autodocs'],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const ROOT = 'sb-gallery';

const makeTextBlock = (id: string, style: I.TextStyle, text: string, extra: any = {}) => new M.Block({
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

const makeDivBlock = (id: string, style: I.DivStyle) => new M.Block({
	id,
	type: I.BlockType.Div,
	childrenIds: [],
	fields: {},
	content: { style },
});

const makeBookmarkBlock = (id: string, targetObjectId: string) => new M.Block({
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

const makeLinkBlock = (id: string, targetBlockId: string) => new M.Block({
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
});

const makeTocBlock = (id: string) => new M.Block({
	id,
	type: I.BlockType.TableOfContents,
	childrenIds: [],
	fields: {},
	content: {},
});

const makeFileBlock = (id: string, type: I.FileType) => new M.Block({
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

const textStyleMap: { style: I.TextStyle; label: string; text: string; extra?: any }[] = [
	{ style: I.TextStyle.Paragraph, label: 'Paragraph', text: 'The quick brown fox jumps over the lazy dog.' },
	{ style: I.TextStyle.Header1, label: 'Header1', text: 'Header Level 1' },
	{ style: I.TextStyle.Header2, label: 'Header2', text: 'Header Level 2' },
	{ style: I.TextStyle.Header3, label: 'Header3', text: 'Header Level 3' },
	{ style: I.TextStyle.Quote, label: 'Quote', text: 'The only way to do great work is to love what you do.' },
	{ style: I.TextStyle.Code, label: 'Code', text: 'const greeting = "Hello, world!";' },
	{ style: I.TextStyle.Checkbox, label: 'Checkbox', text: 'Unchecked task item' },
	{ style: I.TextStyle.Bulleted, label: 'Bulleted', text: 'Bulleted list item' },
	{ style: I.TextStyle.Numbered, label: 'Numbered', text: 'Numbered list item' },
	{ style: I.TextStyle.Callout, label: 'Callout', text: 'This is a callout block for important information.' },
];

const sectionHeadingStyle = { margin: '24px 0 8px', color: 'var(--color-text-secondary)' };

const BlockWrap = ({ block, children }: { block: any; children: React.ReactNode }) => (
	<div className={`block ${U.Data.blockClass(block)} align0`}>
		<div className="wrapMenu" />
		<div className="wrapContent">
			{children}
		</div>
	</div>
);

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

		const bmBlock = makeBookmarkBlock('gallery-bookmark', 'gallery-bm-target');
		const linkBlock = makeLinkBlock('gallery-link', 'gallery-link-target');
		const tocBlock = makeTocBlock('gallery-toc');
		const fileBlock = makeFileBlock('gallery-file', I.FileType.File);
		const imageBlock = makeFileBlock('gallery-image', I.FileType.Image);
		const audioBlock = makeFileBlock('gallery-audio', I.FileType.Audio);
		const videoBlock = makeFileBlock('gallery-video', I.FileType.Video);
		const pdfBlock = makeFileBlock('gallery-pdf', I.FileType.Pdf);

		return (
			<div className="blocks" style={{ padding: 16, maxWidth: 700 }}>
				<h3 style={sectionHeadingStyle}>Text Blocks</h3>
				{textStyleMap.map(({ style, label, text }) => {
					const block = makeTextBlock(`gallery-text-${label}`, style, text);
					return (
						<BlockWrap key={label} block={block}>
							<BlockText rootId={ROOT} block={block} />
						</BlockWrap>
					);
				})}

				<h3 style={sectionHeadingStyle}>Dividers</h3>
				{[ I.DivStyle.Line, I.DivStyle.Dot ].map((style) => {
					const block = makeDivBlock(`gallery-div-${style}`, style);
					return (
						<BlockWrap key={style} block={block}>
							<BlockDiv rootId={ROOT} block={block} />
						</BlockWrap>
					);
				})}

				<h3 style={sectionHeadingStyle}>Bookmark</h3>
				<BlockWrap block={bmBlock}>
					<BlockBookmark rootId={ROOT} block={bmBlock} getWrapperWidth={() => 600} />
				</BlockWrap>

				<h3 style={sectionHeadingStyle}>Link</h3>
				<BlockWrap block={linkBlock}>
					<BlockLink rootId={ROOT} block={linkBlock} getWrapperWidth={() => 600} />
				</BlockWrap>

				<h3 style={sectionHeadingStyle}>Table of Contents</h3>
				<BlockWrap block={tocBlock}>
					<BlockTableOfContents rootId={ROOT} block={tocBlock} />
				</BlockWrap>

				<h3 style={sectionHeadingStyle}>Media Blocks</h3>
				<BlockWrap block={fileBlock}>
					<BlockFile rootId={ROOT} block={fileBlock} />
				</BlockWrap>
				<BlockWrap block={imageBlock}>
					<BlockImage rootId={ROOT} block={imageBlock} />
				</BlockWrap>
				<BlockWrap block={audioBlock}>
					<BlockAudio rootId={ROOT} block={audioBlock} />
				</BlockWrap>
				<BlockWrap block={videoBlock}>
					<BlockVideo rootId={ROOT} block={videoBlock} />
				</BlockWrap>
				<BlockWrap block={pdfBlock}>
					<BlockPdf rootId={ROOT} block={pdfBlock} />
				</BlockWrap>
			</div>
		);
	},
};
