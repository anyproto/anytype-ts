import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { HeaderHelpIndex as Header } from 'ts/component';
import { I, Util } from 'ts/lib';

interface Props extends RouteComponentProps<any> {};

import Block from './item/block';

class PageHelpShortcuts extends React.Component<Props, {}> {

	render () {
		const path: any[] = [
			{ icon: ':question:', name: 'Help', contentId: 'index' },
			{ icon: ':keyboard:', name: 'Keyboard & Shortcuts', contentId: 'shortcuts' },
		];

		const blocks: any[] = [
			{ type: I.BlockType.Icon, icon: ':keyboard:' },
			{ type: I.BlockType.Text, style: I.TextStyle.Title, text: 'Keyboard & Shortcuts' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header1, text: 'Application' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header3, text: 'Basic keys' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Use <b>cmd</b> & <b>Option</b> in MacOS and <b>ctrl<b> & <b>Alt</b> in Windows or Linux' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Press <b>cmd or ctrl</b> to create new page on a dashboard' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header1, text: 'Editor' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header2, text: 'Page' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header3, text: 'Menu' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Press <b>/</b> to activate add block menu. You can use up & arrow keys to move in menu. Forward & backward to get into & close sub menu. Use filter and start writing the block name to chose the right one without a mouse.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Press <b>cmd or ctrl + /</b> to initialise turn into menu' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header3, text: 'Basic blocks' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Press <b>Enter</b> to create new block' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Press <b>backspace</b> or <b>delete</b> to delete selected blocks.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Press <b>Tab</b> to create nested block. If you want to make it on the same level as a parent block press <b>Shift + Tab</b>. In other words to indent & un-indent use <b>Tab</b> or <b>Shift+Tab</b>' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Press <b>Shift + Enter</b> to create a line break within a block of text.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header3, text: 'Lists' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'When you working with lists pressing <b>Enter</b> on the end of the line will create a new element of the list if. If you want to end the list simply press <b>Enter</b> on empty block list — it will convert list to text block.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Press <b>backspace</b> or <b>delete</b> to merge element with the one above' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Press <b>Tab</b> & <b>Shift+Tab</b> to create nested lists and move it right and left' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header3, text: 'Actions' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Press <b>cmd or ctrl + ↑</b> to move to the start of the page, Press <b>cmd or ctrl + ↓</b> to move to the end of the page' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Press <b>cmd or ctrl + a</b> once to select the block your cursor is in.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'To duplicate selected block press <b>cmd or ctrl + d<b>' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Hold down <b>shift + up/down arrow keys</b> to expand your selection up or down. ' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Use <b>cmd + Option + click</b> or <b>ctrl + ALT + click</b> to select or de-select an entire block.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header3, text: 'Style' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'With text selected, press <b>cmd or ctrl + b</b> to **bold text**.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'With text selected, press <b>cmd or ctrl + i</b> to *italicize text*.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'With text selected, press <b>cmd or ctrl + shift + s</b> for ~~strikethrough~~.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'With text selected, press <b>cmd or ctrl + k</b> to add a link. You can also paste a URL over selected text to turn it into a link using <b>cmd or ctrl<b>+<b>v<b>.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'With text selected, press <b>cmd or ctrl + e</b> for inline code.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header2, text: 'Markdown' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header3, text: 'At the beginning of any new line or existing block of content, when write these:**' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Type <b>*</b>, <b>-</b>, or <b>+</b>followed by <b>space</b> to create a bulleted list.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Type <b>[]</b> to create a to-do checkbox.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Type <b>1.</b> followed by <b>space</b> to create a numbered list.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Type <b>#</b> followed by <b>space</b> to create an H1 heading.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Type <b>##</b> followed by <b>space</b> to create an H2 sub-heading.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Type <b>###</b> followed by <b>space</b> to create an H3 sub-heading.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Type <b>">"</b> followed by <b>space</b> to create a toggle list.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Type <b>"</b> followed by <b>space</b> to create a quote block.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Header2, text: 'Commands' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Write command <b>/image</b> will bring up the Option or ALT to upload or embed an image, or add one from [Unsplash](http://unsplash.com).' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Write command <b>/video</b> lets you upload a video file or embed a video from YouTube, Vimeo, etc.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Write command <b>/file</b> lets you upload any file from your computer or create an embed.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Write command <b>/code</b> creates a code block where you can write and copy any snippet of code.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Write command <b>/duplicate</b> creates an exact copy of the current block.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Write command <b>/moveto</b> lets you move that block to a different page.' },
			{ type: I.BlockType.Text, style: I.TextStyle.Bulleted, text: 'Write command <b>/delete</b> deletes the current block.' }
		];

		return (
			<div className="wrapper">
				<Header {...this.props} path={path} />

				<div className="editor">
					<div className="blocks">
						{blocks.map((item: any, i: number) => (
							<Block key={i} {...this.props} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};

};

export default PageHelpShortcuts;
