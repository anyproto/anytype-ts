import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconUser, ListIndex, Cover, Title, HeaderMainIndex as Header, FooterMainIndex as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I, Util} from 'ts/lib';
import { documentStore } from 'ts/store';

const $ = require('jquery');
const raf = require('raf');
const Constant: any = require('json/constant.json');

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	authStore?: any;
};

@inject('commonStore')
@inject('authStore')
@observer
class PageMainIndex extends React.Component<Props, {}> {
	
	listRef: any = null;

	constructor (props: any) {
		super(props);
		
		this.onSettings = this.onSettings.bind(this);
		this.onProfile = this.onProfile.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};
	
	render () {
		const { commonStore, authStore } = this.props;
		const { account } = authStore;
		const { cover } = commonStore;
		
		if (!account) {
			return <div />;
		};
		
		return (
			<div>
				<Cover num={cover} />
				<Header />
				<Footer />
				
				<div id="body" className="wrapper">
					<div className="title">
						Hi, {account.name}
						<div className="rightMenu">
							<Icon className={'settings ' + (commonStore.popupIsOpen('settings') ? 'active' : '')} onClick={this.onSettings} />
							<Icon className={'profile ' + (commonStore.popupIsOpen('profile') ? 'active' : '')} />
							<IconUser {...account} onClick={this.onProfile} />
						</div>
					</div>
					
					<ListIndex ref={(ref) => { this.listRef = ref; }} onAdd={this.onAdd} />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		let items: any[] = [
			{ icon: ':wave:', name: 'Get started' },
			{ icon: ':bulb:', name: 'Ideas' },
			{ icon: ':inbox_tray:', name: 'Projects' },
			{ icon: ':alien:', name: 'Secrets' },
			{ icon: ':mortar_board:', name: 'Education' },
			{ icon: ':poop:', name: 'Other' },
			{ icon: ':wastebasket:', name: 'Archive' },
		];
		
		for (let i = 0; i < items.length; ++i) {
			items[i].id = String(i + 1);
			documentStore.documentAdd(items[i]);			
		};
	};
	
	onSettings (e: any) {
		const { commonStore } = this.props;
		commonStore.popupOpen('settings', {});
	};
	
	onProfile (e: any) {
		const { commonStore } = this.props;
		commonStore.popupOpen('profile', {});
	};
	
	onAdd (e: any) {
		documentStore.documentAdd({
			id: String(documentStore.documents.length + 1),
			name: 'Untitled',
			icon: Util.randomSmile(),
		});
	};
	
	resize () {
		this.listRef.resize();
	};

};

export default PageMainIndex;