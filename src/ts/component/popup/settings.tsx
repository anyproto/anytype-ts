import * as React from 'react';
import { Icon, IconUser, Button, Title, Label } from 'ts/component';
import { I, Storage } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.PopupInterface {
	history: any;
	commonStore?: any;
	authStore?: any;
};

interface State {
	page: string;
};

@inject('commonStore')
@inject('authStore')
@observer
class PopupSettings extends React.Component<Props, {}> {

	state = {
		page: ''
	};
	
	constructor (props: any) {
		super(props);
		
		this.onClose = this.onClose.bind(this);
		this.onLogout = this.onLogout.bind(this);
	};
	
	render () {
		const { authStore } = this.props;
		const { account } = authStore;
		const { page } = this.state;
		
		let content = null;
		
		switch (page) {
			default:
				content = (
					<div className="index">
						<Icon className="close" onClick={this.onClose} />
						<Title text="Settings" />
						<div className="rows">
							<div className="row">
								<Icon className="wallpaper" />
								<Label text="Wallpaper" />
								<Icon className="arrow" />
							</div>
							<div className="row">
								<Icon className="phrase" />
								<Label text="Keychain phrase" />
								<Icon className="arrow" />
							</div>
							<div className="row">
								<Icon className="pin" />
								<Label text="Pin code" />
								<Icon className="arrow" />
							</div>
							<div className="row">
								<Icon className="notify" />
								<Label text="Notifications" />
								<div className="switches">
								</div>
							</div>
						</div>
						<div className="logout" onClick={this.onLogout}>Log out</div>
					</div>
				);
				break;
		};
		
		return (
			<div>
				{content}
			</div>
		);
	};
	
	onClose () {
		const { commonStore, id } = this.props;
		
		commonStore.popupClose(id);
	};
	
	onLogout (e: any) {
		const { authStore, history } = this.props;
		
		authStore.logout();
		history.push('/');
	};
	
};

export default PopupSettings;