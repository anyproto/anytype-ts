import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconUser, ListIndex, Cover, Title, HeaderMainIndex as Header, FooterMainIndex as Footer } from 'ts/component';
import { commonStore, authStore, blockStore} from 'ts/store';
import { observer } from 'mobx-react';
import { I, C, Util, DataUtil, translate, Storage } from 'ts/lib';
import arrayMove from 'array-move';

interface Props extends RouteComponentProps<any> {};

const com = require('proto/commands.js');
const $ = require('jquery');
const Constant: any = require('json/constant.json');

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
		this.getTree = this.getTree.bind(this);
	};
	
	render () {
		const { account } = authStore;
		const { coverId, coverImg } = commonStore;
		const { root } = blockStore;
		
		return (
			<div>
				<Cover num={coverId} image={coverImg} />
				<Header {...this.props} />
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
							getTree={this.getTree}
							helperContainer={() => { return $('#documents').get(0); }} 
						/>
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		Storage.set('pageId', '');
	};
	
	componentDidUpdate () {
		this.resize();
	};
	
	onSettings (e: any) {
		commonStore.popupOpen('settings', {});
	};
	
	onAccount () {
		commonStore.menuOpen('account', {
			type: I.MenuType.Vertical, 
			element: '#button-account',
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right
		});
	};
	
	onProfile (e: any) {
	};
	
	onSelect (e: any, block: any) {
		if (block.content.style == I.LinkStyle.Archive) {
			commonStore.popupOpen('archive', {});
		} else {
			DataUtil.pageOpen(e, this.props, block.id, block.content.targetBlockId);
		};
	};
	
	onAdd (e: any) {
		DataUtil.pageCreate(e, this.props, '', Constant.default.name);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		if (oldIndex == newIndex) {
			return;
		};
		
		const { blocks, root } = blockStore;
		const list = blocks.get(root);
		const tree = this.getTree();
		const current = tree[oldIndex];
		const target = tree[newIndex];
		const block = list.find((it: I.Block) => { return it.id == root; });
		
		if (!current || !target || !block) {
			return;
		};
		
		const position = newIndex < oldIndex ? I.BlockPosition.Top : I.BlockPosition.Bottom;
		const oidx = block.childrenIds.indexOf(current.id);
		const nidx = block.childrenIds.indexOf(target.id);

		block.childrenIds = arrayMove(block.childrenIds, oidx, nidx);
		C.BlockListMove(root, [ current.id ], target.id, position);
	};
	
	resize () {
		const tree = this.getTree();
		const size = Constant.index.document;
		const win = $(window);
		const wh = win.height();
		const ww = win.width();
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('#body');
		const documents = node.find('#documents');
		const cnt = Math.floor((ww -  size.margin * 2) / (size.width + size.margin));
		
		let width = cnt * (size.width + size.margin);
		let height = size.height + size.margin;
		
		if (tree.length + 1 > cnt) {
			height *= 2;
		};
		
		body.css({ width: width - size.margin });
		documents.css({ marginTop: wh - 134 - height });
	};
	
	getTree () {
		const { blocks, root } = blockStore;

		let tree = blockStore.prepareTree(root);
		tree = tree.filter((it: any) => { return !(it.content.fields || {}).isArchived; });
		
		return tree;
	};

};

export default PageMainIndex;