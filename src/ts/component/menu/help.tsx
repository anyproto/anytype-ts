import * as React from 'react';
import { Icon } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { MenuInterface, MenuItemInterface } from 'ts/store/common';

interface Props extends MenuInterface {
	commonStore?: any;
};

const { ipcRenderer } = window.require('electron');
const Url: any = require('json/url.json');
const Config: any = require('json/config.json');

@inject('commonStore')
@observer
class MenuHelp extends React.Component<Props, {}> {
	
	render () {
		const items: MenuItemInterface[] = [
			{ id: 'chat', name: 'Chat with Us' },
			{ id: 'feature', name: 'Suggest a Feature' },
			{ id: 'community', name: 'Join our Community' }
		];
		
		const Item = (item: MenuItemInterface) => (
			<div className="item" onMouseDown={(e) => { this.click(item); }}>
				<Icon className={item.id} />
				<div className="name">{item.name}</div>
			</div>
		);
		
		return (
			<div className="items">
				{items.map((item: MenuItemInterface, i) => (
					<Item key={i} {...item} />
				))}
			</div>
		);
	};
	
	click (item: any) {
		const { id, commonStore } = this.props;
		commonStore.menuClose(id);
		
		switch (item.id) {
			case 'chat':
				Intercom('boot', {
				    app_id: Config.intercom,
				    name: 'test',
				    user_id: 'test'
				});
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