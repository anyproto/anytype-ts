import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconUser, ListIndex, Cover, Title, HeaderMainIndex as Header, FooterMainIndex as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I, Util} from 'ts/lib';

const com = require('proto/commands.js');
const $ = require('jquery');
const Constant: any = require('json/constant.json');

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	authStore?: any;
	blockStore?: any;
};

@inject('commonStore')
@inject('authStore')
@inject('blockStore')
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
			return null;
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
		const { blockStore } = this.props;
		
		blockStore.blockClear();
		dispatcher.call('blockOpen', { id: Constant.index.rootId }, (errorCode: any, message: any) => {
			this.resize();
		});
	};
	
	componentWillUnmount () {
		dispatcher.call('blockClose', { id: Constant.index.rootId }, (errorCode: any, message: any) => {
		});
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
		commonStore.popupOpen('tree', {});
	};
	
	onSelect (e: any, id: string) {
		const { history } = this.props;
		history.push('/main/edit/' + id);
	};
	
	onAdd (e: any) {
		const { blockStore } = this.props;
		const { blocks, root } = blockStore;

		let block: any = {};
		let last = '';
		
		if (blocks.length) {
			last = blocks[blocks.length - 1].id;
			
			if (last == 'testpage') {
				last = '';
			};
		};
		
		block.fields = { 
			icon: Util.randomSmile(), 
			name: 'Untitled' 
		};
		block[I.BlockType.Page] = com.anytype.model.Block.Content.Page.create({
			style: I.PageStyle.Empty,
		});
		block = com.anytype.model.Block.create(block);
		
		let request = {
			block: block,
			contextId: root,
			parentId: root,
			targetId: last,
			position: I.BlockPosition.After,
		};
		dispatcher.call('blockCreate', request, (errorCode: any, message: any) => {
		});
	};
	
	resize () {
		const { blockStore } = this.props;
		const { blocks } = blockStore;
		
		let size = Constant.index.document;
		let win = $(window);
		let wh = win.height();
		let ww = win.width();
		let node = $(ReactDOM.findDOMNode(this));
		let body = node.find('#body');
		let documents = node.find('#documents');
		let cnt = Math.floor((ww -  size.margin * 2) / (size.width + size.margin));
		let width = cnt * (size.width + size.margin);
		let height = size.height + size.margin;
		
		if (blocks.length + 1 > cnt) {
			height *= 2;
		};
			
		body.css({ width: width - size.margin });
		documents.css({ marginTop: wh - 130 - height });
	};

};

export default PageMainIndex;