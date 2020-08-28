import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, Util } from 'ts/lib';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

interface State {
	page: string;
};

const $ = require('jquery');

class PopupShortcut extends React.Component<Props, State> {

	state = {
		page: 'main',
	};
	
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

		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="items">
					{item.children.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			</div>
		);

		const Item = (item: any) => {
			return (
				<div className="item">
					<div className="key">{platform == I.Platform.Mac ? item.mac : item.com}</div>
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
		this.resize();
		this.props.position();
	};

	onPage (id: string) {
		this.setState({ page: id });
	};

	getSections (id: string) {
		const sections = {

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
						{ mac: '⌘ + Y',			 com: 'Ctrl + H',			 name: 'Show page edit history' },
					]
				},

				{ 
					name: 'Structuring', children: [
						{ mac: 'Enter',			 com: 'Enter',				 name: 'Create a new text block' },
						{ mac: 'Shift + Enter',	 com: 'Shift + Enter',		 name: 'Create a line break within a block of text' },
						{ mac: 'Delete',		 com: 'Delete',				 name: 'Merge block with the one above' },
						{ mac: 'Tab',			 com: 'Tab',				 name: 'Indent. Сreates a nested block. Moves it to the right' },
						{ mac: 'Shift + Tab',	 com: 'Shift + Tab',		 name: 'Outdent. Move block to the parent block level to the left' },
					] 
				},

				{ 
					name: 'Selection', children: [
						{ mac: '⌘ + A',			 com: 'Ctrl + A',			 name: 'Select all text in the block, selecting twice will select the whole page' },
						{ mac: 'Shift + ↑ or ↓', com: 'Shift + ↑ or ↓',		 name: 'Expand your selection up or down' },
						{ mac: '⌘ + Click',		 com: 'Ctrl + Click',		 name: 'Select or de-select an entire block' },
						{ mac: 'Shift + Click',	 com: 'Shift + Click',		 name: 'Select another block and all blocks in between' },
					]
				},

				{ 
					name: 'Actions', children: [
						{ mac: '/',				 com: '/',					 name: 'Activate command menu' },
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
						{ mac: '⌘ + L',			 com: 'Ctrl + L',			 name: 'Add a link' },
						{ mac: '⌘ + K',			 com: 'Ctrl + K',			 name: 'Convert to Inline code' },
					]
				},
			],

			navigation: [
				{ 
					name: 'Menu, search and navigation pane', children: [
						{ mac: '',			 com: '',			 name: '' },
						{ mac: '',			 com: '',			 name: '' },
						{ mac: '',			 com: '',			 name: '' },
						{ mac: '',			 com: '',			 name: '' },
						{ mac: '',			 com: '',			 name: '' },
						{ mac: '',			 com: '',			 name: '' },
					]
				},

				{ 
					name: 'Page navigation', children: [
						{ mac: '',			 com: '',			 name: '' },
						{ mac: '',			 com: '',			 name: '' },
						{ mac: '',			 com: '',			 name: '' },
						{ mac: '',			 com: '',			 name: '' },
						{ mac: '',			 com: '',			 name: '' },
						{ mac: '',			 com: '',			 name: '' },
					]
				},
			]

		};

		return sections[id] || [];
	};

	resize () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('.body');

		body.css({ height: win.height() - 100 });
	};
	
};

export default PopupShortcut;