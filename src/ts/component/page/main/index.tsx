import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconUser, ListIndex, Cover, Title, HeaderMainIndex as Header, FooterMainIndex as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { I, C, Util, translate} from 'ts/lib';
import arrayMove from 'array-move';

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
		const { coverId, coverImg } = commonStore;
		const { blocks, root } = blockStore;
		const tree = blockStore.prepareTree(root, blocks[root] || []);
		
		return (
			<div>
				<Cover num={coverId} image={coverImg} />
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
		Util.pageInit(this.props);
	};
	
	componentDidUpdate () {
		this.resize();
	};
	
	componentWillUnmount () {
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
	
	onSelect (e: any, block: any) {
		Util.pageOpen(e, this.props, block.content.targetBlockId);
	};
	
	onAdd (e: any) {
		Util.pageCreate(e, this.props, Util.randomSmile(), Constant.defaultName);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		if (oldIndex == newIndex) {
			return;
		};
		
		const { blockStore } = this.props;
		const { blocks, root } = blockStore;
		const tree = blockStore.prepareTree(root, blocks[root] || []);
		const current = tree[oldIndex];
		const target = tree[newIndex];
		const rootBlock = blocks[root].find((it: I.Block) => { return it.id == root; });
		
		rootBlock.childrenIds = arrayMove(rootBlock.childrenIds, oldIndex, newIndex);
		
		const position = newIndex < oldIndex ? I.BlockPosition.Top : I.BlockPosition.Bottom; 
		
		C.BlockListMove(root, [ current.id ], target.id, position);
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