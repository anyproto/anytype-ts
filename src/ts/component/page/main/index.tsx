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
			{ id: '', type: 1, icon: ':wave:', name: 'Get started', parentId: '' },
			{ id: '', type: 1, icon: ':bulb:', name: 'Ideas', parentId: '' },
			{ id: '', type: 1, icon: ':inbox_tray:', name: 'Projects', parentId: '' },
			{ id: '', type: 1, icon: ':alien:', name: 'Secrets', parentId: '' },
			{ id: '', type: 1, icon: ':mortar_board:', name: 'Education', parentId: '' },
			{ id: '', type: 1, icon: ':poop:', name: 'Other', parentId: '' },
			{ id: '', type: 1, icon: ':wastebasket:', name: 'Archive', parentId: '' },
			{ id: '', type: 1, icon: ':family:', name: 'Contacts', parentId: '' },
		];
		
		blockStore.blockClear();
		for (let i = 0; i < items.length; ++i) {
			items[i].id = String(i + 1);
			blockStore.blockAdd({ header: items[i], content: {}, children: [] });			
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
		
		let idx = 1;
		
		const contentDataview: I.ContentDataview = {
			view: '1',
			views: [
				{ 
					id: '1', name: 'Grid', type: I.ViewType.Grid,
					sorts: [
						{ propertyId: '1', type: I.SortType.Asc },
						{ propertyId: '2', type: I.SortType.Desc },
					],
					filters: [
						{ propertyId: '1', condition: I.FilterTypeCondition.None, equality: I.FilterTypeEquality.Equal, value: '' },
						{ propertyId: '1', condition: I.FilterTypeCondition.And, equality: I.FilterTypeEquality.Equal, value: '' },
					]
				},
				{ id: '2', name: 'Board', type: I.ViewType.Board, sorts: [], filters: [] },
				{ id: '3', name: 'Gallery', type: I.ViewType.Gallery, sorts: [], filters: [] },
				{ id: '4', name: 'List', type: I.ViewType.List, sorts: [], filters: [] },
			],
			properties: [
				{ id: '1', name: 'Id', type: I.PropertyType.Number },
				{ id: '2', name: 'Name', type: I.PropertyType.Title },
				{ id: '4', name: 'E-mail', type: I.PropertyType.Email },
				{ id: '5', name: 'Date', type: I.PropertyType.Date },
				{ id: '6', name: 'Select', type: I.PropertyType.Select, values: [ 'select1', 'select2', 'select3' ] },
				{ id: '7', name: 'Multiple', type: I.PropertyType.Multiple, values: [ 'multiple1', 'multiple2', 'multiple3', 'multiple4', 'multiple5' ] },
				{ id: '8', name: 'Account', type: I.PropertyType.Account, values: [ { name: 'Anton Barulenkov' }, { 'name': 'Zhanna Sharipova' } ] },
				{ id: '9', name: 'File', type: I.PropertyType.File },
				{ id: '10', name: 'Bool', type: I.PropertyType.Bool },
				{ id: '11', name: 'Link', type: I.PropertyType.Link },
				{ id: '12', name: 'Phone', type: I.PropertyType.Phone },
			],
			data: [
				{ 
					'1': '1', '2': 'Anton Pronkin', '4': 'pronkin@gmail.com', '5': 1420200661, '6': 'select1', '11': 'http://anytype.io', 
					'12': '+7 (1234) 5678910', '7': [ 'value1', 'value2', 'value3' ], '10': true, '8': { name: 'Anton Barulenkov' }
				},
				{ '1': '2', '2': 'Roman Khafizianov', '4': 'khafizianov@gmail.com', '5': 1420200661, '6': 'select2', '11': 'ftp://anytype.io' },
				{ '1': '3', '2': 'Zhanna Sharipova', '4': 'sharipova@gmail.com', '5': 1420200662, '6': 'select3', '11': 'telnet://anytype.io' },
				{ '1': '4', '2': 'Anton Barulenkov', '4': 'barulenkov@gmail.com', '5': 1420200662, '6': 'select4', '11': 'https://anytype.io' },
				{ '1': '5', '2': 'Kirill', '4': 'kirill@gmail.com', '5': 1420200663, '6': 'select5' },
			]
		};
		
		let list: I.Block[] = [];
		
		list.push({ 
			header: { id: String(idx++), type: I.BlockType.Icon, name: '', icon: '', parentId: '' },
			content: { icon: ':family:' },
			children: []
		});
		
		list.push({ 
			header: { id: String(idx++), type: I.BlockType.Text, name: '', icon: '', parentId: '' },
			content: {
				text: 'Contacts',
				style: I.TextStyle.title,
				marks: [] as I.Mark[],
				marker: 0,
				toggleable: false,
				checkable: false,
				checked: false,
			},
			children: []
		});
		
		list.push({ 
			header: { id: String(idx++), type: I.BlockType.Dataview, name: '', icon: '', parentId: '' },
			content: contentDataview,
			children: []
		});
		
		list.push({ 
			header: { id: String(idx++), type: I.BlockType.Layout, name: '', icon: '', parentId: '' },
			content: { style: I.LayoutStyle.Row },
			children: []
		});
		
		list.push({ 
			header: { id: String(idx++), type: I.BlockType.Layout, name: '', icon: '', parentId: '4' },
			content: { style: I.LayoutStyle.Column },
			children: []
		});
		
		list.push({ 
			header: { id: String(idx++), type: I.BlockType.Layout, name: '', icon: '', parentId: '4' },
			content: { style: I.LayoutStyle.Column },
			children: []
		});
		
		let s = 0;
		for (let i = 0; i <= 10; ++i) {
			let b = { 
				header: { id: String(idx++), type: I.BlockType.Text, name: '', icon: '', parentId: '' },
				content: {
					text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
					style: I.TextStyle.p,
					marks: [] as I.Mark[],
					marker: Util.rand(1, 2),
					toggleable: true,
					checkable: true,
					checked: false,
				},
				children: [] as I.Block[]
			};
			list.push(b);
			s++;
		};
		
		for (let c = 0; c < 30; ++c) {
			let b = { 
				header: { 
					id: String(idx++),
					parentId: String(Util.rand(5, 7)), 
					type: I.BlockType.Text, 
					name: '', 
					icon: '' 
				},
				content: {
					text: 'Contrary to popular belief, Lorem Ipsum is not simply random text.',
					style: I.TextStyle.p,
					marks: [] as I.Mark[],
					marker: Util.rand(0, 2),
					toggleable: Boolean(Util.rand(0, 1)),
					checkable: Boolean(Util.rand(0, 1)),
					checked: Boolean(Util.rand(0, 1)),
				},
				children: [] as I.Block[]
			};
			list.push(b);
		};
		
		list.push({ 
			header: { id: String(idx++), type: I.BlockType.Image, name: '', icon: '', parentId: '' },
			content: {},
			children: []
		});
		
		list.push({ 
			header: { id: String(idx++), type: I.BlockType.File, name: '', icon: '', parentId: '' },
			content: {},
			children: []
		});
		
		list.push({ 
			header: { id: String(idx++), type: I.BlockType.Video, name: '', icon: '', parentId: '' },
			content: {},
			children: []
		});
		
		list.push({ 
			header: { id: String(idx++), type: I.BlockType.Bookmark, name: '', icon: '', parentId: '' },
			content: {},
			children: []
		});
		
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
				parentId: ''			
			},
			content: {},
			children: []
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