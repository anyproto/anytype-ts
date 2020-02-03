import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { I } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props extends I.Menu {
	authStore?: any;
	history?: any;
};

const { ipcRenderer } = window.require('electron');
const Url = require('json/url.json');
const Constant = require('json/constant.json');

@inject('authStore')
@observer
class MenuHelp extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const items: I.MenuItem[] = [
			{ icon: 'help', name: 'Help' },
			//{ icon: 'chat', name: 'Chat with Us' },
			{ icon: 'feature', name: 'Suggest a Feature' },
			{ icon: 'community', name: 'Join our Community' }
		];
		
		return (
			<div className="items">
				{items.map((item: I.MenuItem, i) => (
					<MenuItemVertical key={item.icon} {...item} onClick={this.onClick} />
				))}
			</div>
		);
	};
	
	onClick (e: any, id: string) {
		const { authStore, history } = this.props;
		const { account } = authStore;
		
		commonStore.menuClose(this.props.id);
		
		switch (id) {
			case 'help':
				history.push('/help/index');
				break;
				
			case 'chat':
				let param: any = {
					app_id: Constant.intercom,
					user_id: 'blank'
				};
				if (account) {
					param.user_id = account.id;
					param.name = account.name;
				};
				
				Intercom('boot', param);
				Intercom('show');
				Intercom('onHide', () => { Intercom('shutdown'); });
				break;
				
			case 'feature':
				ipcRenderer.send('urlOpen', Url.feature);
				break;
				
			case 'community':
				ipcRenderer.send('urlOpen', Url.community);
				break;
		};
	};
	
};

export default MenuHelp;