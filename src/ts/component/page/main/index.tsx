import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconUser, ListIndex, Cover, Title, HeaderMainIndex as Header, FooterMainIndex as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I, Util, translate} from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	authStore?: any;
	blockStore?: any;
};

const com = require('proto/commands.js');
const $ = require('jquery');
const Constant: any = require('json/constant.json');

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
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { commonStore, authStore, blockStore } = this.props;
		const { account } = authStore;
		const { cover } = commonStore;
		const { blocks, root } = blockStore;
		
		if (!account) {
			return null;
		};
		
		const tree = blockStore.prepareTree(root, blocks[root] || []);
		
		return (
			<div>
				<Cover num={cover} />
				<Header />
				<Footer />
				
				<div id="body" className="wrapper">
					<div className="title">
						{Util.sprintf(translate('indexHi'), account.name)}
						
						<div className="rightMenu">
							<Icon className={'settings ' + (commonStore.popupIsOpen('settings') ? 'active' : '')} tooltip="Settings" onClick={this.onSettings} />
							<Icon id="button-account" className={'profile ' + (commonStore.menuIsOpen('account') ? 'active' : '')} tooltip="Accounts" onClick={this.onAccount} />
							<IconUser {...account} tooltip="Your profile" onClick={this.onProfile} />
						</div>
					</div>
					
					<div id="documents"> 
						<ListIndex 
							ref={(ref) => { this.listRef = ref; }}
							onSelect={this.onSelect} 
							onAdd={this.onAdd}
							onSortEnd={this.onSortEnd}
							rootId={root}
							helperContainer={() => { return $('#documents').get(0); }} 
						/>
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { blockStore } = this.props;
		
		dispatcher.call('configGet', {}, (errorCode: any, message: any) => {
			blockStore.rootSet(message.homeBlockId);
			dispatcher.call('blockOpen', { blockId: message.homeBlockId }, (errorCode: any, message: any) => {});
		});
	};
	
	componentDidUpdate () {
		this.resize();
	};
	
	componentWillUnmount () {
		const { blockStore } = this.props;
		const { root } = blockStore;
		
		dispatcher.call('blockClose', { blockId: root }, (errorCode: any, message: any) => {});
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
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right
		});
	};
	
	onProfile (e: any) {
	};
	
	onSelect (e: any, id: string) {
		const { commonStore, history } = this.props;
		
		if (e.shiftKey) {
			commonStore.popupOpen('editorPage', {
				data: { id: id }
			});
		} else {
			history.push('/main/edit/' + id);
		};
	};
	
	onAdd (e: any) {
	};
	
	onSortEnd (result: any) {
		const { blockStore } = this.props;
		const { blocks, root } = blockStore;
		const tree = blockStore.prepareTree(root, blocks[root] || []);
		const { oldIndex, newIndex } = result;
		const position = newIndex < oldIndex ? I.BlockPosition.Before : I.BlockPosition.After; 
		
		let request = {
			rootId: root,
			blockIds: [ tree[oldIndex].id ],
			dropTargetId: tree[newIndex].id,
			position: position,
		};
		
		dispatcher.call('blockListMove', request, (errorCode: any, message: any) => {});
	};
	
	resize () {
		const { blockStore } = this.props;
		const { blocks, root } = blockStore;
		const tree = blockStore.prepareTree(root, blocks[root] || []);
		
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
		
		if (tree.length + 1 > cnt) {
			height *= 2;
		};
			
		body.css({ width: width - size.margin });
		documents.css({ marginTop: wh - 134 - height });
	};

};

export default PageMainIndex;