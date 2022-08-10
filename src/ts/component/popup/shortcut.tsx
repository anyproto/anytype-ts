import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, Util } from 'Lib';

interface Props extends I.Popup, RouteComponentProps<any> {};

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
		const isMac = platform == I.Platform.Mac;
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
					<div className="key" dangerouslySetInnerHTML={{ __html: isMac && item.mac ? item.mac : item.com }} />
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

				<div className="body scrollable">
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
		let cmd = '&#8984;';
		let sections = {

			main: [
				{
					name: 'Basics', children: [
						{ mac: `${cmd} + N`,			 com: 'Ctrl + N',			 name: 'Create a new object on the dashboard' },
						{ mac: `${cmd} + Shift + N`,	 com: 'Ctrl + Shift + N',	 name: 'New Anytype window' },
						{ mac: `${cmd} + Option + N`,	 com: 'Ctrl + Alt + N',		 name: 'Create a new object in new window' },
						{ mac: `${cmd} + Z`,			 com: 'Ctrl + Z',			 name: 'Undo' },
						{ mac: `${cmd} + Shift + Z`,	 com: 'Ctrl + Shift + Z',	 name: 'Redo' },
						{ mac: `${cmd} + P`,			 com: 'Ctrl + P',			 name: 'Print' },
						{ mac: `${cmd} + F`,			 com: 'Ctrl + F',			 name: 'Find on page' },
						{ mac: `${cmd} + Q`,			 com: 'Ctrl + Q',			 name: 'Close Anytype' },
						{ mac: `${cmd} + Y`,			 com: 'Ctrl + H',			 name: 'Show page edit history' },
						{ mac: `${cmd} + Click`,		 com: 'Ctrl + Click',		 name: 'On page link will open it in modal view' },
						{ mac: `Ctrl + Space`,			 com: 'Ctrl + Space',		 name: 'Shortcuts to launch shortcuts view' },
						{ mac: `${cmd} + \\`,			 com: 'Ctrl + \\',			 name: 'Toggle sidebar' },
						{ mac: `${cmd} + Plus`,			 com: 'Ctrl + Plus',		 name: 'Zoom in' },
						{ mac: `${cmd} + Minus`,		 com: 'Ctrl + Minus',		 name: 'Zoom out' },
						{ mac: `${cmd} + 0`,			 com: 'Ctrl + 0',			 name: 'Default zoom' },
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
						{ mac: `${cmd} + A`,			 com: 'Ctrl + A',			 name: 'Select all blocks in the page' },
						{ com: 'Shift + ↑ or ↓',		 name: 'Expand your selection up or down' },
						{ mac: `${cmd} + Click`,		 com: 'Ctrl + Click',		 name: 'On block will select or de-select an entire block' },
						{ com: 'Shift + Click',			 name: 'Select block and all blocks in between' },
					]
				},

				{
					name: 'Actions', children: [
						{ com: '/',						 name: 'Activate command menu' },
						{ mac: `${cmd} + /`,			 com: 'Ctrl + /',			 name: 'Open action menu' },
						{ mac: `${cmd} + Delete`,		 com: 'Ctrl + Backspace',	 name: 'Deletes the words left to the cursor' },
						{ mac: `${cmd} + C`,			 com: 'Ctrl + C',			 name: 'Copy selected block/blocks or text part' },
						{ mac: `${cmd} + X`,			 com: 'Ctrl + X',			 name: 'Cut selected block/blocks or text part' },
						{ mac: `${cmd} + V`,			 com: 'Ctrl + V',			 name: 'Paste data outside Anytype, block/blocks or text part' },
						{ mac: `${cmd} + D`,			 com: 'Ctrl + D',			 name: 'Duplicate selected block/blocks' },
						{ mac: `${cmd} + E`,			 com: 'Ctrl + E',		 name: 'Launch emoji menu' },
					]
				},

				{
					name: 'Text style', children: [
						{ mac: `${cmd} + B`,			 com: 'Ctrl + B',			 name: 'Bold' },
						{ mac: `${cmd} + I`,			 com: 'Ctrl + I',			 name: 'Italic' },
						{ mac: `${cmd} + U`,			 com: 'Ctrl + U',			 name: 'Underline' },
						{ mac: `${cmd} + Shift +S`,		 com: 'Ctrl + Shift + S',	 name: 'Strikethrough' },
						{ mac: `${cmd} + K`,			 com: 'Ctrl + K',			 name: 'Add a link' },
						{ mac: `${cmd} + L`,			 com: 'Ctrl + L',			 name: 'Convert to Inline code' },
						{ mac: `${cmd} + Shift + C`,	 com: 'Ctrl + Shift + C',	 name: 'Apply previously selected font color' },
						{ mac: `${cmd} + Shift + H`,	 com: 'Ctrl + Shift + H',	 name: 'Apply previously selected highlight' },
					]
				},
			],

			navigation: [
				{
					name: 'Basics', children: [
						{ mac: `${cmd} + O`,			 com: 'Ctrl + O',			 name: 'Open the navigation pane' },
						{ mac: `${cmd} + Option + O`,	 com: 'Ctrl + Alt + O',		 name: 'Open the graph pane' },
						{ mac: `${cmd} + S`,			 com: 'Ctrl + S',			 name: 'Open the search pane' },
						{ mac: `${cmd} + Enter`,		 com: 'Alt + H',			 name: 'Return to the home screen' },
						{ mac: `${cmd} + [`,			 com: 'Alt + ←',			 name: 'Show the previous page from history' },
						{ mac: `${cmd} + ]`,			 com: 'Alt + →',			 name: 'Show the next page from history' },
					]
				},

				{
					name: 'Menu, search and navigation pane', children: [
						{ com: '↓ or Tab',			 name: 'Go the next option' },
						{ com: '↑ or Shift + Tab',	 name: 'Go to the previous option' },
						{ com: '←',					 name: 'Go to the left side of navigation. Link from page' },
						{ com: '→',					 name: 'Go to the right side of navigation. Link to page' },
						{ com: 'Enter',				 name: 'Select option' },
					]
				},

				{
					name: 'Page navigation', children: [
						{ com: '↓',				 name: 'Go down one line' },
						{ com: '↑',				 name: 'Go up one line' },
						{ mac: `${cmd} + ←`,	 com: 'Ctrl + ←',	 name: 'Go to the start of the line' },
						{ mac: `${cmd} + →`,	 com: 'Ctrl + →',	 name: 'Go to the end of the line' },
						{ mac: `${cmd} + ↑`,	 com: 'Ctrl + ↑',	 name: 'Go to the start of the page' },
						{ mac: `${cmd} + ↓`,	 com: 'Ctrl + ↓',	 name: 'Go to the end of the page' },
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
						{ com: '```',		 name: 'Create a code block' },
						{ com: '`',		 name: 'Inline code' },
						{ com: '** or __',		 name: 'Inline bold' },
						{ com: '* or _',		 name: 'Inline italic' },
						{ com: '~~',		 name: 'Inline strikethrough' },
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
						{ com: '@today, @tomorrow',	name: 'Create an object with a relative date. Also available: @three days ago, @last month, @2016-05-12' },
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

		const { getId } = this.props;

		raf(() => {
			const win = $(window);
			const obj = $(`#${getId()}-innerWrap`);
			const width = Math.max(732, Math.min(960, win.width() - 128));

			obj.css({ width: width, marginLeft: -width / 2, marginTop: 0 });
		});
	};

};

export default PopupShortcut;
