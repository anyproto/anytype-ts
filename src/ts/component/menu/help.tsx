import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { I } from 'ts/lib';

interface Props extends I.MenuInterface {
	commonStore?: any;
	authStore?: any;
};

const { ipcRenderer } = window.require('electron');
const Url: any = require('json/url.json');
const Config: any = require('json/config.json');

@inject('commonStore')
@inject('authStore')
@observer
class MenuHelp extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const items: I.MenuItemInterface[] = [
			{ icon: 'chat', name: 'Chat with Us' },
			{ icon: 'feature', name: 'Suggest a Feature' },
			{ icon: 'community', name: 'Join our Community' }
		];
		
		return (
			<div className="items">
				{items.map((item: I.MenuItemInterface, i) => (
					<MenuItemVertical key={i} {...item} onClick={this.onClick} />
				))}
			</div>
		);
	};
	
	onClick (e: any, id: string) {
		const { commonStore, authStore } = this.props;
		const { account } = authStore;
		
		commonStore.menuClose(this.props.id);
		
		switch (id) {
			case 'chat':
				let param: any = {
					app_id: Config.intercom,
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