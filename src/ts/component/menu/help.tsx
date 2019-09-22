import * as React from 'react';
import { Icon, MenuItemInterface } from 'ts/component';
import { observer, inject } from 'mobx-react';

interface Props {
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
			{ icon: 'chat', name: 'Chat with Us' },
			{ icon: 'feature', name: 'Suggest a Feature' },
			{ icon: 'community', name: 'Join our Community' }
		];
		
		const Item = (item: MenuItemInterface) => (
			<div className="item" onMouseDown={(e) => { this.click(item); }}>
				<Icon className={item.icon} />
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
		const { commonStore } = this.props;
		commonStore.menuCloseAll();
		
		switch (item.icon) {
			case 'chat':
				Intercom('boot', {
				    app_id: Config.intercom,
				    name: 'test',
				    user_id: 'test'
				});
				Intercom('show');
				Intercom('onHide', () => {
					Intercom('shutdown');
				});
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