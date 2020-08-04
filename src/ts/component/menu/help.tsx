import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { authStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props extends I.Menu {
	history?: any;
};

const { ipcRenderer } = window.require('electron');
const Url = require('json/url.json');
const Constant = require('json/constant.json');

@observer
class MenuHelp extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const items: any[] = [
			{ id: 'help', name: 'What\'s new', document: 'whatsNew' },
			{ id: 'help', name: 'Status', document: 'status' },
			{ id: 'help', name: 'Shortcuts', document: 'shortcuts' },
			{ id: 'feedback', name: 'Give feedback' },
			{ id: 'community', name: 'Join community' },
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
		const { history } = this.props;
		
		this.props.close();
		
		switch (item.id) {
			case 'help':
				commonStore.popupOpen('help', {
					data: { document: item.document },
				});
				break;
				
			case 'feedback':
				commonStore.popupOpen('feedback', {});
				break;
				
			case 'community':
				ipcRenderer.send('urlOpen', Url.community);
				break;
		};
	};
	
};

export default MenuHelp;