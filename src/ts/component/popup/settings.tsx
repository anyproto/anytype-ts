import * as React from 'react';
import { Icon, IconUser, Button, Title, Label, Cover } from 'ts/component';
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
		page: 'index'
	};
	
	constructor (props: any) {
		super(props);
		
		this.onClose = this.onClose.bind(this);
		this.onPage = this.onPage.bind(this);
		this.onCover = this.onCover.bind(this);
		this.onLogout = this.onLogout.bind(this);
	};
	
	render () {
		const { authStore } = this.props;
		const { account } = authStore;
		const { page } = this.state;
		
		let content = null;
		
		switch (page) {
			
			default:
			case 'index':
				content = (
					<div>
						<Icon className="close" onClick={this.onClose} />
						<Title text="Settings" />
						
						<div className="rows">
							<div className="row" onClick={() => { this.onPage('wallpaper'); }}>
								<Icon className="wallpaper" />
								<Label text="Wallpaper" />
								<Icon className="arrow" />
							</div>
							<div className="row" onClick={() => { this.onPage('phrase'); }}>
								<Icon className="phrase" />
								<Label text="Keychain phrase" />
								<Icon className="arrow" />
							</div>
							<div className="row" onClick={() => { this.onPage('pin'); }}>
								<Icon className="pin" />
								<Label text="Pin code" />
								<Icon className="arrow" />
							</div>
							<div className="row" onClick={() => { this.onPage('notify'); }}>
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
				
			case 'wallpaper':
				let covers = [];
				for (let i = 1; i <= 7; ++i) {
					covers.push({ id: i });
				};
				
				const Item = (item: any) => (
					<div className="item" onClick={() => { this.onCover(item.id); }}>
						<Cover num={item.id} />
					</div>
				);
				
				content = (
					<div>
						<Icon className="back" onClick={() => { this.onPage('index'); }} />
						<Title text="Wallpaper" />
						
						<div className="covers">
							{covers.map((item: any, i: number) => (
								<Item key={i} {...item} />
							))}
						</div>
					</div>
				);
				break;
				
			case 'phrase':
				break;
				
			case 'pin':
				break;
				
			case 'notify':
				break;
		};
		
		return (
			<div className={page}>
				{content}
			</div>
		);
	};
	
	onClose () {
		const { commonStore, id } = this.props;
		commonStore.popupClose(id);
	};
	
	onPage (id: string) {
		this.setState({ page: id });
	};
	
	onCover (id: number) {
		const { commonStore } = this.props;
		commonStore.coverSet(id);
	};
	
	onLogout (e: any) {
		const { authStore, history } = this.props;
		
		authStore.logout();
		history.push('/');
	};
	
};

export default PopupSettings;