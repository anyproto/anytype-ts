import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconUser, ListIndex, Cover, Title, HeaderMainIndex as Header, FooterMainIndex as Footer } from 'ts/component';
import { commonStore, blockStore} from 'ts/store';
import { observer } from 'mobx-react';
import { I, C, Util, DataUtil, translate, Storage, crumbs } from 'ts/lib';
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
		const { cover } = commonStore;
		const { root, profile } = blockStore;
		const element = blockStore.getLeaf(root, root);

		if (!element) {
			return null;
		};
		
		const details = blockStore.getDetails(profile, profile);
		const childrenIds = blockStore.getChildrenIds(root, root);
		const length = childrenIds.length;
		const list = this.getList();
		const map = blockStore.getDetailsMap(root);
		const size = map.size;
		
		return (
			<div>
				<Cover type={cover.type} className={cover.id} image={cover.image} />
				<Header {...this.props} />
				<Footer {...this.props} />
				
				<div id="body" className="wrapper">
					<div className="title">
						<span id="hello">{details.name ? Util.sprintf(translate('indexHi'), Util.shorten(details.name, 24)) : ''}</span>
						
						<div className="rightMenu">
							<Icon className={'settings ' + (commonStore.popupIsOpen('settings') ? 'active' : '')} tooltip="Settings" onClick={this.onSettings} />
							<Icon id="button-account" className={'profile ' + (commonStore.menuIsOpen('account') ? 'active' : '')} tooltip="Accounts" onClick={this.onAccount} />
							<IconUser avatar={details.iconImage} name={details.name} tooltip="Your profile" onClick={this.onProfile} />
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
		const node = $(ReactDOM.findDOMNode(this));
		const hello = node.find('#hello');

		Storage.set('pageId', '');
		crumbs.delete(I.CrumbsType.Page);

		if (Storage.get('hello')) {
			hello.remove();
		} else {
			window.setTimeout(() => {
				Storage.set('hello', 1);
				hello.addClass('hide');
			}, 2000);
		};
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
		const { history } = this.props;
		const { profile } = blockStore;
		
		if (!profile) {
			return;
		};
		
		history.push('/main/edit/' + profile);
	};
	
	onSelect (e: any, block: I.Block) {
		if (block.content.style == I.LinkStyle.Archive) {
			commonStore.popupOpen('archive', {});
		} else {
			crumbs.cut(I.CrumbsType.Page, 0, () => {
				DataUtil.pageOpen(e, this.props, block.content.targetBlockId);
			});
		};
	};
	
	onAdd (e: any) {
		const { root } = blockStore;
		const details = { 
			iconEmoji: Util.randomSmile(), 
			name: Constant.default.name 
		};
		
		DataUtil.pageCreate(e, this.props, root, '', details, I.BlockPosition.Bottom, (message: any) => {
			Util.scrollTopEnd();
		});
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
		const size = Constant.size.index;
		const win = $(window);
		const wh = win.height();
		const ww = win.width();
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('#body');
		const documents = node.find('#documents');
		const items = node.find('#documents .item');

		const maxWidth = ww - size.border * 2;
		const cnt = Math.floor(maxWidth / (size.width + size.margin));
		const width = Math.floor((maxWidth - size.margin * (cnt - 1)) / cnt);

		let height = size.height + size.margin;
		if (list.length + 1 > cnt) {
			height *= 2;
		};
		height += 20;
		
		items.css({ width: width }).removeClass('last');
		body.css({ width: maxWidth });
		documents.css({ marginTop: wh - 130 - height });

		if (items.length > cnt) {
			items.each((i: number, item: any) => {
				item = $(item);
				if ((i + 1) >= cnt && ((i + 1) % cnt === 0) && (list.length + 1 > cnt)) {
					item.addClass('last');
				};
			});
		};
	};

	getList () {
		const { root } = blockStore;
		return blockStore.getChildren(root, root, (it: any) => {
			const details = blockStore.getDetails(root, it.content.targetBlockId);
			return !details.isArchived;
		});
	};

};

export default PageMainIndex;