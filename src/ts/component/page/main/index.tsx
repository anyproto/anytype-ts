import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, IconUser, Smile, Cover, Title, HeaderMainIndex as Header, FooterMainIndex as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I, Util} from 'ts/lib';

const $ = require('jquery');
const raf = require('raf');

const ITEM_WIDTH = 224;
const ITEM_HEIGHT = 112;
const MARGIN = 16;

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	authStore?: any;
	documentStore?: any;
};

interface State {};

@inject('commonStore')
@inject('authStore')
@inject('documentStore')
@observer
class PageMainIndex extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
	};

	constructor (props: any) {
		super(props);
		
		this.onSettings = this.onSettings.bind(this);
		this.onProfile = this.onProfile.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};
	
	render () {
		const { commonStore, authStore, documentStore } = this.props;
		const { account } = authStore;
		const { cover } = commonStore;
		const { documents } = documentStore;
		const length = documents.length;
		
		if (!account) {
			return <div />;
		};
		
		const Item = SortableElement((item: any) => {
			return (
				<div className="item" >
					<Smile icon={item.icon} size={24} />
					<div className="name">{item.name}</div>
				</div>
			);
		});
		
		const ItemAdd = SortableElement((item: any) => {
			return (
				<div className="item add" onClick={this.onAdd}>
					<Icon />
				</div>
			);
		});
		
		const List = SortableContainer((item: any) => {
			return (
				<div id="documents"> 
					{item.list.map((item: any, i: number) => (
						<Item key={item.id} {...item} index={i} />
					))}
					<ItemAdd index={length + 1} disabled={true} />
				</div>
			);
		});
		
		return (
			<div>
				<Cover num={cover} />
				<Header />
				<Footer />
				
				<div id="body" className="wrapper">
					<div className="title">
						Hi, {account.name}
						<div className="rightMenu">
							<Icon className="settings" onClick={this.onSettings} />
							<Icon className="profile" />
							<IconUser {...account} onClick={this.onProfile} />
						</div>
					</div>
					
					<List axis="xy" list={documents} helperContainer={() => { return $('#documents').get(0); }} />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		
		const { documentStore } = this.props;
		
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
	
	componentDidUpdate () {
		this.resize();
	};
	
	componentWillUnmount () {
		this._isMounted = false;	
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
		const { documentStore } = this.props;
		
		documentStore.documentAdd({
			id: String(documentStore.documents.length + 1),
			name: 'Untitled',
			icon: Util.randomSmile(),
		});
	};
	
	resize () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			let win = $(window);
			let wh = win.height();
			let ww = win.width();
			let node = $(ReactDOM.findDOMNode(this));
			let body = node.find('#body');
			let documents = node.find('#documents');
			let width = Math.floor((ww - MARGIN * 2) / ITEM_WIDTH) * ITEM_WIDTH;
			
			body.css({ width: width });
			documents.css({ 
				width: width, 
				top: wh - (ITEM_HEIGHT * 2 + MARGIN * 2), 
				marginLeft: -width / 2 + MARGIN
			});
		});
	};

};

export default PageMainIndex;