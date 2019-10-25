import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconUser, ListIndex, Cover, Title, HeaderMainIndex as Header, FooterMainIndex as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I, Util} from 'ts/lib';
import { blockStore } from 'ts/store';

const $ = require('jquery');
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
		this.onAccount = this.onAccount.bind(this);
		this.onProfile = this.onProfile.bind(this);
		this.onSelect = this.onSelect.bind(this);
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
							<Icon id="button-account" className={'profile ' + (commonStore.menuIsOpen('account') ? 'active' : '')} onClick={this.onAccount} />
							<IconUser {...account} onClick={this.onProfile} />
						</div>
					</div>
					
					<div id="documents"> 
						<ListIndex 
							ref={(ref) => { this.listRef = ref; }}
							onSelect={this.onSelect} 
							onAdd={this.onAdd}
							helperContainer={() => { return $('#documents').get(0); }} 
						/>
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		
		dispatcher.call('blockOpen', { id: 'dashboard' }, (errorCode: any, message: any) => {
		});
		
		let items: I.BlockHeader[] = [
			{ id: '', type: 1, icon: ':wave:', name: 'Get started' },
			{ id: '', type: 1, icon: ':bulb:', name: 'Ideas' },
			{ id: '', type: 1, icon: ':inbox_tray:', name: 'Projects' },
			{ id: '', type: 1, icon: ':alien:', name: 'Secrets' },
			{ id: '', type: 1, icon: ':mortar_board:', name: 'Education' },
			{ id: '', type: 1, icon: ':poop:', name: 'Other' },
			{ id: '', type: 1, icon: ':wastebasket:', name: 'Archive' },
			{ id: '', type: 1, icon: ':family:', name: 'Contacts' },
		];
		
		blockStore.blockClear();
		for (let i = 0; i < items.length; ++i) {
			items[i].id = String(i + 1);
			blockStore.blockAdd({ header: items[i], content: {} });			
		};
		
		this.resize();
	};
	
	onSettings (e: any) {
		const { commonStore } = this.props;
		commonStore.popupOpen('settings', {});
	};
	
	onAccount () {
		const { commonStore } = this.props;
		
		commonStore.menuOpen('account', { 
			element: 'button-account',
			offsetY: 4,
			light: true,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right
		});
	};
	
	onProfile (e: any) {
		const { commonStore } = this.props;
		commonStore.popupOpen('profile', {});
	};
	
	onSelect (e: any, id: string) {
		const { history } = this.props;
		
		const contentDataview: I.ContentDataview = {
			view: '1',
			views: [
				{ 
					id: '1', name: 'Grid', type: I.ViewType.Grid,
					sort: [
						{ propertyId: '1', type: I.SortType.Asc },
						{ propertyId: '2', type: I.SortType.Desc },
					]
				},
				{ id: '2', name: 'Board', type: I.ViewType.Board, sort: [] },
				{ id: '3', name: 'Gallery', type: I.ViewType.Gallery, sort: [] },
				{ id: '4', name: 'List', type: I.ViewType.List, sort: [] },
			],
			properties: [
				{ id: '1', name: 'Id', type: I.PropertyType.Number },
				{ id: '2', name: 'Name', type: I.PropertyType.Title },
				{ id: '3', name: 'E-mail', type: I.PropertyType.Text },
				{ id: '4', name: 'Date', type: I.PropertyType.Date },
			],
			data: [
				{ '1': '1', '2': 'Anton Pronkin', '3': 'pronkin@gmail.com', '4': 1420200660 },
				{ '1': '2', '2': 'Roman Khafizianov', '3': 'khafizianov@gmail.com', '4': 1420200660 },
				{ '1': '3', '2': 'Zhanna Sharipova', '3': 'sharipova@gmail.com', '4': 1420200660 },
				{ '1': '4', '2': 'Anton Barulenkov', '3': 'barulenkov@gmail.com', '4': 1420200660 },
				{ '1': '5', '2': 'Kirill', '3': 'kirill@gmail.com', '4': 1420200660 },
			]
		};
		
		let list: I.Block[] = [
			{ 
				header: { id: '1', type: 2, name: '', icon: '' },
				content: contentDataview,
			}
		];
		
		for (let i = 2; i < 10; ++i) {
			list.push({ 
				header: { id: String(i), type: 3, name: '', icon: '' },
				content: {
					text: 'test content',
					style: Util.rand(0, 5),
					marks: [],
					marker: 0,
					toggleable: false,
					checkable: false,
					checked: false,
				},
			});
		};
		
		blockStore.blockClear();
		for (let block of list) {
			blockStore.blockAdd(block);
		};
		
		history.push('/main/edit/' + id);
	};
	
	onAdd (e: any) {
		blockStore.blockAdd({
			header: {
				id: String(blockStore.blocks.length + 1),
				type: 1,
				name: 'Untitled',
				icon: Util.randomSmile(),				
			},
			content: {}
		});
	};
	
	resize () {
		let size = Constant.index.document;
		let win = $(window);
		let wh = win.height();
		let ww = win.width();
		let node = $(ReactDOM.findDOMNode(this));
		let body = node.find('#body');
		let documents = node.find('#documents');
		let cnt = Math.floor((ww -  size.margin * 2) / (size.width + size.margin));
		let width = cnt * (size.width + size.margin);
			
		body.css({ width: width - size.margin });
		documents.css({ marginTop: wh - 130 - (size.height * 2 + size.margin * 2) });
	};

};

export default PageMainIndex;