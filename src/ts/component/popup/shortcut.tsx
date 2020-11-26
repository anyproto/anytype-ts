import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, Util } from 'ts/lib';
import { Label } from 'ts/component';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

interface State {
	page: string;
};

const $ = require('jquery');
const raf = require('raf');

class PopupShortcut extends React.Component<Props, State> {

	state = {
		page: 'main',
	};
	_isMounted: boolean = false;

	render () {
		const { page } = this.state;
		const platform = Util.getPlatform();
		const tabs = [
			{ id: 'main', name: 'Main' },
			{ id: 'navigation', name: 'Navigation' },
			{ id: 'markdown', name: 'Markdown' },
			{ id: 'command', name: 'Commands' },
		];
		const sections = this.getSections(page);

		const Tab = (item: any) => (
			<div className={[ 'item', (item.id == page ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onPage(item.id); }}>
				{item.name}
			</div>
		);

		const Section = (item: any) => {
			let cn = [ 'section' ];
			if (item.className) {
				cn.push(item.className);
			};
			return (
				<div className={[ 'section', (item.className || '') ].join(' ')}>
					{item.name ? <div className="name">{item.name}</div> : ''}
					{item.description ? <div className="descr">{item.description}</div> : ''}
					<div className="items">
						{item.children.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</div>
				</div>
			);
		};

		const Item = (item: any) => {
			return (
				<div className="item">
					<div className="key">{(platform == I.Platform.Mac) && item.mac ? item.mac : item.com}</div>
					<div className="descr">{item.name}</div>
				</div>
			);
		};

		return (
			<div className="wrapper">
				<div className="head">
					<div className="tabs">
						{tabs.map((item: any, i: number) => (
							<Tab key={i} {...item} />
						))}
					</div>
				</div>

				<div className="body">
					{sections.map((item: any, i: number) => (
						<Section key={i} {...item} />
					))}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;

		this.resize();
		this.props.position();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onPage (id: string) {
		this.setState({ page: id });
	};

	getSections (id: string) {
		let sections = {

			main: [
				{
					name: 'Basics', children: [
						{ mac: '⌘ + N',			 com: 'Ctrl + N',			 name: 'Create a new page on the dashboard' },
						{ mac: '⌘ + O',			 com: 'Ctrl + O',			 name: 'Open the navigation pane' },
						{ mac: '⌘ + S',			 com: 'Ctrl + S',			 name: 'Open the search pane' },
						{ mac: '⌘ + Enter',		 com: 'Alt + H',			 name: 'Return to the home screen' },
						{ mac: '⌘ + [',			 com: 'Alt + ←',			 name: 'Show the previous page from history' },
						{ mac: '⌘ + ]',			 com: 'Alt + →',			 name: 'Show the next page from history' },
						{ mac: '⌘ + Z',			 com: 'Ctrl + Z',			 name: 'Undo' },
						{ mac: '⌘ + Shift + Z',	 com: 'Ctrl + Shift + Z',	 name: 'Redo' },
						{ mac: '⌘ + P',			 com: 'Ctrl + P',			 name: 'Print' },
						{ mac: '⌘ + F',			 com: 'Ctrl + F',			 name: 'Find on page' },
						{ mac: '⌘ + Q',			 com: 'Ctrl + Q',			 name: 'Close Anytype' },
						{ mac: '⌘ + Y',			 com: 'Ctrl + H',			 name: 'Show page edit history' },
						{ mac: '⌘ + Click',			 com: 'Ctrl + Click',		 name: 'On page link will open it in modal view' },
					]
				},

				{
					name: 'Structuring', children: [
						{ com: 'Enter',				 name: 'Create a new text block' },
						{ com: 'Shift + Enter',		 name: 'Create a line break within a block of text' },
						{ com: 'Delete',			 name: 'Merge block with the one above' },
						{ com: 'Tab',				 name: 'Indent. Сreates a nested block. Moves it to the right' },
						{ com: 'Shift + Tab',		 name: 'Outdent. Move block to the parent block level to the left' },
					]
				},

				{
					name: 'Selection', children: [
						{ com: 'Double Click',			 name: 'Select word' },
						{ com: 'Triple Click',			 name: 'Select an entire block' },
						{ mac: '⌘ + A',				 com: 'Ctrl + A',			 name: 'Select all blocks in the page' },
						{ com: 'Shift + ↑ or ↓',	 name: 'Expand your selection up or down' },
						{ mac: '⌘ + Click',			 com: 'Ctrl + Click',		 name: 'On block will select or de-select an entire block' },
						{ com: 'Shift + Click',		 name: 'Select block and all blocks in between' },
					]
				},

				{
					name: 'Actions', children: [
						{ com: '/',				 name: 'Activate command menu' },
						{ mac: '⌘ + /',			 com: 'Ctrl + /',			 name: 'Open action menu' },
						{ mac: '⌘ + Delete',	 com: 'Ctrl + Backspace',	 name: 'Deletes the words left to the cursor' },
						{ mac: '⌘ + C',			 com: 'Ctrl + C',			 name: 'Copy selected block/blocks or text part' },
						{ mac: '⌘ + X',			 com: 'Ctrl + X',			 name: 'Cut selected block/blocks or text part' },
						{ mac: '⌘ + V',			 com: 'Ctrl + V',			 name: 'Paste data outside Anytype, block/blocks or text part' },
						{ mac: '⌘ + D',			 com: 'Ctrl + D',			 name: 'Duplicate selected block/blocks' },
					]
				},

				{
					name: 'Text style', children: [
						{ mac: '⌘ + B',			 com: 'Ctrl + B',			 name: 'Bold' },
						{ mac: '⌘ + I',			 com: 'Ctrl + I',			 name: 'Italic' },
						{ mac: '⌘ + Shift +S',	 com: 'Ctrl + Shift + S',	 name: 'Strikethrough' },
						{ mac: '⌘ + K',			 com: 'Ctrl + K',			 name: 'Add a link' },
						{ mac: '⌘ + L',			 com: 'Ctrl + L',			 name: 'Convert to Inline code' },
					]
				},
			],

			navigation: [
				{
					name: 'Menu, search and navigation pane', children: [
						{ com: '↓ or Tab',			 name: 'Go the next option' },
						{ com: '↑ or Shift + Tab',	 name: 'Go to the previous option' },
						{ com: '←',					 name: 'Go to the left side of navigation. Link from page' },
						{ com: '→',					 name: 'Go to the right side of navigation. Link to page' },
						{ mac: '⌘ + ↑',				 com: 'Ctrl + ↑',			 name: 'Go to the start of the page' },
						{ com: 'Enter',				 name: 'Select option' },
					]
				},

				{
					name: 'Page navigation', children: [
						{ com: '↓',		 name: 'Go down one line' },
						{ com: '↑',		 name: 'Go up one line' },
						{ mac: '⌘ + ←',	 com: 'Ctrl + ←',	 name: 'Go to the start of the line' },
						{ mac: '⌘ + →',	 com: 'Ctrl + →',	 name: 'Go to the end of the line' },
						{ mac: '⌘ + ↑',	 com: 'Ctrl + ↑',	 name: 'Go to the start of the page' },
						{ mac: '⌘ + ↓',	 com: 'Ctrl + ↓',	 name: 'Go to the end of the page' },
					]
				},
			],

			markdown: [
				{
					description: 'To format your blocks using Markdown, simply use any of these commands at the beginning of any new line.',
					children: [
						{ com: '# + Space',			 name: 'Create an H1 heading' },
						{ com: '# # + Space',		 name: 'Create an H2 heading' },
						{ com: '# # # + Space',		 name: 'Create an H3 heading' },
						{ com: '" + Space',			 name: 'Create a highlighted block' },
						{ com: '* or + or - and Space',	 name: 'Create a bulleted list' },
						{ com: '[] + Space',		 name: 'Create a to-do checkbox' },
						{ com: '1. + Space',		 name: 'Create a numbered list' },
						{ com: '>  + Space',		 name: 'Create a toggle list' },
						{ com: '```  + Space',		 name: 'Create a code block' },
					]
				},
			],

			command: [
				{
					name: 'Menu', children: [
						{ com: '/',					 name: 'Activate command menu' },
						{ com: '↓ & ↑',				 name: 'Move in menu' },
						{ com: '→ & ←',				 name: 'Get into & close sub menu' },
						{ com: 'Esc or Clear /',	 name: 'Close menu' },
					]
				},

				{ description: 'After pressing / start writing the block name to choose the right one without a mouse, change block colors, and activate actions.', children: [], className: 'separator' },
				{
					name: 'Text', children: [
						{ com: '/text',			 name: 'Text block' },
						{ com: '/h1',			 name: 'Large heading' },
						{ com: '/h2',			 name: 'Medium-sized heading' },
						{ com: '/h3',			 name: 'Small heading' },
						{ com: '/high',			 name: 'Highlighted block of larger text' },
					]
				},

				{
					name: 'Lists', children: [
						{ com: '/todo',			 name: 'To-do list with checkboxes' },
						{ com: '/bullet',		 name: 'Bulleted list' },
						{ com: '/num',			 name: 'Numbered list' },
						{ com: '/toggle',		 name: 'Toggle list' },
					]
				},

				{
					name: 'Objects', children: [
						{ com: '/page',			 name: 'Page' },
						{ com: '/file',			 name: 'File' },
						{ com: '/image',		 name: 'Image' },
						{ com: '/video',		 name: 'Video' },
						{ com: '/bookmark',		 name: 'Bookmark' },
						{ com: '/link',			 name: 'Link to page' },
					]
				},

				{
					name: 'Other', children: [
						{ com: '/line',			 name: 'Line divider' },
						{ com: '/dots',			 name: 'Dots divider' },
						{ com: '/code',			 name: 'Code  snippet' },
					]
				},
			]

		};

		return sections[id] || [];
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		raf(() => {
			const win = $(window);
			const obj = $('#popupShortcut #innerWrap');
			const width = Math.max(732, Math.min(960, win.width() - 128));

			obj.css({ width: width, marginLeft: -width / 2, marginTop: 0 });
		});
	};

};

export default PopupShortcut;
