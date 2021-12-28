import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, Util, Onboarding, keyboard } from 'ts/lib';
import { popupStore, detailStore, blockStore } from 'ts/store';

interface Props extends I.Menu {};

const { ipcRenderer } = window.require('electron');
const Url = require('json/url.json');
const Constant = require('json/constant.json');

class MenuHelp extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const items: any[] = [
			{ id: 'feedback', name: 'Send Feedback' },
			{ id: 'docs', name: 'Help & Tutorials' },
			{ id: 'help', name: 'What\'s new', document: 'whatsNew' },
			{ id: 'community', name: 'Join our Community' },
			{ id: 'shortcut', name: 'Keyboard Shortcuts' },
			{ id: 'hints', name: 'Show hints' },
		];

		return (
			<div className="items">
				{items.map((item: I.MenuItem, i: number) => (
					<MenuItemVertical key={i} {...item} onClick={(e: any) => { this.onClick(e, item); }} />
				))}
			</div>
		);
	};

	onClick (e: any, item: any) {
		this.props.close();

		switch (item.id) {
			case 'help':
				popupStore.open('help', {
					data: { document: item.document },
				});
				break;

			case 'shortcut':
				popupStore.open('shortcut', {});
				break;

			case 'feedback':
				ipcRenderer.send('urlOpen', Url.feedback);
				break;

			case 'community':
				ipcRenderer.send('urlOpen', Url.community);
				break;

			case 'docs':
				ipcRenderer.send('urlOpen', Url.docs);
				break;

			case 'hints':
				const isPopup = keyboard.isPopup();
				const rootId = keyboard.getRootId();
				const object = detailStore.get(rootId, rootId, []);
				const match = keyboard.getMatch();
				const { page, action } = match.params;
				const isEditor = (page == 'main') && (action == 'edit');

				let key = '';

				if (object.type == Constant.typeId.set) {
					key = 'set';
				} else 
				if (object.type == Constant.typeId.template) {
					key = 'template';
				} else
				if (isEditor) {
					key = blockStore.checkBlockType(rootId) ? 'typeSelect' : 'editor';
				} else {
					key = Util.toCamelCase([ page, action ].join('-'));
				};

				if (key) {
					Onboarding.start(key, isPopup, true);
				};
				break;

		};
	};

};

export default MenuHelp;
