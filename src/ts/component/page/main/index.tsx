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
	};
	
	render () {
		const { account } = authStore;
		const { coverId, coverImg } = commonStore;
		const { root } = blockStore;
		const element = blockStore.getLeaf(root, root);

		if (!element) {
			return null;
		};
		
		const childrenIds = blockStore.getChildrenIds(root, root);
		const length = childrenIds.length;
		const list = this.getList();
		const map = blockStore.getDetailMap(root);
		const size = map.size;
		
		return (
			<div>
				<Cover type={I.CoverType.Image} num={coverId} image={coverImg} />
				<Header {...this.props} />
				<Footer />
				
				<div id="body" className="wrapper">
					<div className="title">
						{Util.sprintf(translate('indexHi'), Util.shorten(account.name, 16))}
						
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
		DataUtil.pageCreate(e, this.props, Util.randomSmile(), Constant.default.name);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		if (oldIndex == newIndex) {
			return;
		};
		
		const { root } = blockStore;
		const list = this.getList();
		const current = list[oldIndex];
		const target = list[newIndex];
		const map = blockStore.getMap(root);
		const element = map[root];
		
		if (!current || !target || !element) {
			return;
		};
		
		const position = newIndex < oldIndex ? I.BlockPosition.Top : I.BlockPosition.Bottom;
		const oidx = element.childrenIds.indexOf(current.id);
		const nidx = element.childrenIds.indexOf(target.id);

		blockStore.blockUpdateStructure(root, root, arrayMove(element.childrenIds, oidx, nidx));
		
		C.BlockListMove(root, root, [ current.id ], target.id, position);
	};
	
	resize () {
		const list = this.getList();
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
		
		if (list.length + 1 > cnt) {
			height *= 2;
		};
		
		body.css({ width: width - size.margin });
		documents.css({ marginTop: wh - 134 - height });
	};
	
	getList () {
		const { root } = blockStore;
		return blockStore.getChildren(root, root, (it: any) => {
			const details = blockStore.getDetail(root, it.content.targetBlockId);
			return !details.isArchived;
		});
	};

};

export default PageMainIndex;