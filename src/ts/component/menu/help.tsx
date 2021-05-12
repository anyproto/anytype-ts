import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I } from 'ts/lib';
import { authStore, popupStore, blockStore, detailStore } from 'ts/store';

interface Props extends I.Menu {
	history?: any;
};

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
			{ id: 'help', name: 'What\'s new', document: 'whatsNew' },
			{ id: 'help', name: 'Status', document: 'status' },
			{ id: 'shortcut', name: 'Shortcuts' },
			//{ id: 'intercom', name: 'Help & feedback' },
			{ id: 'feedback', name: 'Give feedback' },
			{ id: 'community', name: 'Join community forum' },
			{ id: 'telegramClosedBeta', name: 'Telegram closed group' },
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
		const { account } = authStore;
		const { profile } = blockStore;
		const object = detailStore.get(profile, profile);

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
				popupStore.open('feedback', {});
				break;

			case 'community':
				ipcRenderer.send('urlOpen', Url.community);
				break;

			case 'telegramClosedBeta':
				ipcRenderer.send('urlOpen', Url.telegramClosedBeta);
				break;

			case 'intercom':
				break;
		};
	};

};

export default MenuHelp;
