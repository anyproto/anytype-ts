import * as React from 'react';
import { Icon, MenuItemInterface } from 'ts/component';
import { observer, inject } from 'mobx-react';

interface Props {
	commonStore?: any;
};

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
	};
	
	/*
	click (item: any) {
		let { profile } = this.state;
		profile = profile || {};
		
		Analytics.event('menu_help_' + item.icon);
		Action.commonMenuClose(this.props.id);
		
		switch (item.icon) {
			case 'chat':
				Intercom('boot', {
				    app_id: Config.intercom,
				    name: profile.name,
				    user_id: profile.id
				});
				Intercom('show');
				Intercom('onHide', () => {
					Intercom('shutdown');
				});
				break;
				
			case 'feature':
				ipcRenderer.send('url', Config.url.feature);
				break;
				
			case 'community':
				ipcRenderer.send('url', Config.url.community);
				break;
		};
	};
	*/
	
};

export default MenuHelp;