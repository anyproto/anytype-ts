import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { I } from 'ts/lib';

interface Props extends I.MenuInterface {
	commonStore?: any;
};

const { ipcRenderer } = window.require('electron');
const Url: any = require('json/url.json');
const Config: any = require('json/config.json');

@inject('commonStore')
@observer
class MenuHelp extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.click = this.click.bind(this);
	};
	
	render () {
		const items: I.MenuItemInterface[] = [
			{ id: 'chat', name: 'Chat with Us' },
			{ id: 'feature', name: 'Suggest a Feature' },
			{ id: 'community', name: 'Join our Community' }
		];
		
		return (
			<div className="items">
				{items.map((item: I.MenuItemInterface, i) => (
					<MenuItemVertical key={i} {...item} click={this.click} />
				))}
			</div>
		);
	};
	
	click (e: any, id: string) {
		const { commonStore } = this.props;
		commonStore.menuClose(this.props.id);
		
		switch (id) {
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