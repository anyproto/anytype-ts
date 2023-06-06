import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { I, Util, keyboard } from 'Lib';

interface State {
	page: string;
};

class PopupShortcut extends React.Component<I.Popup, State> {

	state = {
		page: 'main',
	};
	_isMounted = false;

	render () {
		const { page } = this.state;
		const isMac = Util.isPlatformMac();
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
			const cn = [ 'section' ];
			if (item.className) {
				cn.push(item.className);
			};

			return (
				<div className={cn.join(' ')}>
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
		const cmd = keyboard.cmdSymbol();
		const alt = keyboard.altSymbol();

		const sections = {

			main: [
				{
					name: 'Basics', children: [
						{ com: `${cmd} + N`,			 name: 'Create new object' },
						{ com: `${cmd} + Shift + N`,	 name: 'New Anytype window' },
						{ com: `${cmd} + ${alt} + N`,	 name: 'Create a new object in new window' },
						{ com: `${cmd} + Enter`,		 name: 'Opens object in new window from search interface' },
						{ com: `${cmd} + ${alt} + F`,	 name: 'Toggle fullscreen' },
						{ com: `${cmd} + Z`,			 name: 'Undo' },
						{ com: `${cmd} + Shift + Z`,	 name: 'Redo' },
						{ com: `${cmd} + P`,			 name: 'Print' },
						{ com: `${cmd} + F`,			 name: 'Find on page' },
						{ com: `${cmd} + Q`,			 name: 'Close Anytype' },
						{ mac: `${cmd} + Y`,			 com: 'Ctrl + H',			 name: 'Show page edit history' },
						{ com: 'Shift + Click',			 name: 'On page link will open it in modal view' },
						{ com: `${cmd} + Click`,		 name: 'On page link will open it in new window' },
						{ com: 'Ctrl + Space',		 name: 'Shortcuts to launch shortcuts view' },
						{ com: `${cmd} + \\, ${cmd} + .`, name: 'Toggle sidebar' },
						{ com: `${cmd} + =`,			 name: 'Zoom in' },
						{ com: `${cmd} + Minus`,		 name: 'Zoom out' },
						{ com: `${cmd} + 0`,			 name: 'Default zoom' },
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
						{ com: `${cmd} + A`,			 name: 'Select all blocks in the page' },
						{ com: 'Shift + ↑ or ↓',		 name: 'Expand your selection up or down' },
						{ com: `${cmd} + Click`,		 name: 'On block will select or de-select an entire block' },
						{ com: 'Shift + Click',			 name: 'Select block and all blocks in between' },
					]
				},

				{
					name: 'Actions', children: [
						{ com: '/',						 name: 'Activate command menu' },
						{ com: `${cmd} + /`,			 name: 'Open action menu' },
						{ mac: `${cmd} + Delete`,		 com: 'Ctrl + Backspace',	 name: 'Deletes the words left to the cursor' },
						{ com: `${cmd} + C`,			 name: 'Copy selected block/blocks or text part' },
						{ com: `${cmd} + X`,			 name: 'Cut selected block/blocks or text part' },
						{ com: `${cmd} + V`,			 name: 'Paste data outside Anytype, block/blocks or text part' },
						{ com: `${cmd} + D`,			 name: 'Duplicate selected block/blocks' },
						{ com: `${cmd} + E`,			 name: 'Show emoji picker 🏄‍♂️' },
					]
				},

				{
					name: 'Text style', children: [
						{ com: `${cmd} + B`,			 name: 'Bold' },
						{ com: `${cmd} + I`,			 name: 'Italic' },
						{ com: `${cmd} + U`,			 name: 'Underline' },
						{ com: `${cmd} + Shift +S`,		 name: 'Strikethrough' },
						{ com: `${cmd} + K`,			 name: 'Add a link' },
						{ com: `${cmd} + L`,			 name: 'Convert to Inline code' },
						{ com: `${cmd} + Shift + C`,	 name: 'Apply previously selected font color' },
						{ com: `${cmd} + Shift + H`,	 name: 'Apply previously selected highlight' },
					]
				},
			],

			navigation: [
				{
					name: 'Basics', children: [
						{ com: `${cmd} + ,(comma)`,		 name: 'Open settings' },
						{ com: `${cmd} + O`,			 name: 'Open the navigation pane' },
						{ com: `${cmd} + ${alt} + O`,	 name: 'Open the graph pane' },
						{ com: `${cmd} + S, ${cmd} + K`, name: 'Open the search pane' },
						{ com: `${cmd} + L`,			 name: 'Open the library pane' },
						{ com: `${alt} + H`,			 name: 'Return to the home screen' },
						{ mac: `${cmd} + [, ${cmd} + ←`, com: 'Alt + ←',			 name: 'Show the previous page from history' },
						{ mac: `${cmd} + ], ${cmd} + →`, com: 'Alt + →',			 name: 'Show the next page from history' },
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
						{ com: `${cmd} + Shift + T`, name: 'Expand / Collapse Toggle' },
						{ com: '↓',				 name: 'Go down one line' },
						{ com: '↑',				 name: 'Go up one line' },
						{ com: `${cmd} + ←`,	 name: 'Go to the start of the line' },
						{ com: `${cmd} + →`,	 name: 'Go to the end of the line' },
						{ com: `${cmd} + ↑`,	 name: 'Go to the start of the page' },
						{ com: `${cmd} + ↓`,	 name: 'Go to the end of the page' },
						{ com: `${cmd} + Shift + ↑↓`, name: 'Move selected block(s) around' },
					]
				},
			],

			markdown: [
				{
					name: 'While typing', 
					children: [
						{ com: '`',					 name: 'Inline code' },
						{ com: '** or __',			 name: 'Inline bold' },
						{ com: '* or _',			 name: 'Inline italic' },
						{ com: '~~',				 name: 'Inline strikethrough' },
						{ com: '-->',				 name: 'Inserts: ⟶' },
						{ com: '<--',				 name: 'Inserts: ⟵' },
						{ com: '<-->',				 name: 'Inserts: ⟷' },
						{ com: '->',				 name: 'Inserts: →' },
						{ com: '<-',				 name: 'Inserts: ←' },
						{ com: '--',				 name: 'Inserts: —' },
						{ com: '—>',				 name: 'Inserts: ⟶' },
						{ com: '<—',				 name: 'Inserts: ⟵' },
						{ com: '(c)',				 name: 'Inserts: ©' },
						{ com: '(r)',				 name: 'Inserts: ®' },
						{ com: '(tm)',				 name: 'Inserts: ™' },
						{ com: '...',				 name: 'Inserts: …' },
					]
				},
				{
					name: 'At the beginning of any new line', 
					children: [
						{ com: '# + Space',			 name: 'Create an H1 heading' },
						{ com: '# # + Space',		 name: 'Create an H2 heading' },
						{ com: '# # # + Space',		 name: 'Create an H3 heading' },
						{ com: '" + Space',			 name: 'Create a highlighted block' },
						{ com: '* or + or - and Space',	 name: 'Create a bulleted list' },
						{ com: '[] + Space',		 name: 'Create a to-do checkbox' },
						{ com: '1. + Space',		 name: 'Create a numbered list' },
						{ com: '>  + Space',		 name: 'Create a toggle list' },
						{ com: '```',				 name: 'Create a code block' },
						{ com: '---',				 name: 'Create line divider' },
						{ com: '***',				 name: 'Create dots divider' },
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

		const { getId, position } = this.props;

		raf(() => {
			const { ww } = Util.getWindowDimensions();
			const obj = $(`#${getId()}-innerWrap`);
			const width = Math.max(732, Math.min(960, ww - 128));

			obj.css({ width });
			position();
		});
	};

};

export default PopupShortcut;
