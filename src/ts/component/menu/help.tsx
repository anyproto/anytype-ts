import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, Util } from 'ts/lib';
import { authStore, popupStore, blockStore, detailStore } from 'ts/store';

interface Props extends I.Menu {
	history?: any;
};

const { ipcRenderer, remote } = window.require('electron');
const Url = require('json/url.json');
const { app, process } = remote;
const version = app.getVersion();
const systemVersion = process.getSystemVersion();

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
			{ id: 'feedback', name: 'Give feedback' },
			{ id: 'community', name: 'Help' },
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

		};
	};

};

export default MenuHelp;
