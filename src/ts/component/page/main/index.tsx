import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconUser, ListIndex, Cover, HeaderMainIndex as Header, FooterMainIndex as Footer } from 'ts/component';
import { commonStore, blockStore} from 'ts/store';
import { observer } from 'mobx-react';
import { I, C, Util, DataUtil, SmileUtil, translate, Storage, crumbs } from 'ts/lib';
import arrayMove from 'array-move';

interface Props extends RouteComponentProps<any> {};

const $ = require('jquery');
const raf = require('raf');
const Constant: any = require('json/constant.json');

@observer
class PageMainIndex extends React.Component<Props, {}> {
	
	listRef: any = null;

	constructor (props: any) {
		super(props);
		
		this.onAccount = this.onAccount.bind(this);
		this.onProfile = this.onProfile.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMore = this.onMore.bind(this);
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
				<Cover {...cover} />
				<Header {...this.props} />
				<Footer {...this.props} />
				
				<div id="body" className="wrapper">
					<div className="title">
						<span id="hello">{details.name ? Util.sprintf(translate('indexHi'), Util.shorten(details.name, 24)) : ''}</span>
						
						<div className="rightMenu">
							<Icon id="button-account" className={'profile ' + (commonStore.menuIsOpen('account') ? 'active' : '')} tooltip="Accounts" onClick={this.onAccount} />
							<IconUser avatar={details.iconImage} name={details.name} tooltip="Your profile" onClick={this.onProfile} />
						</div>
					</div>
					
					<div id="documents"> 
						<ListIndex 
							ref={(ref) => { this.listRef = ref; }}
							onSelect={this.onSelect} 
							onAdd={this.onAdd}
							onMore={this.onMore}
							onSortEnd={this.onSortEnd}
							getList={this.getList}
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
		const redirectTo = Storage.get('redirectTo');

		if (redirectTo) {
			DataUtil.pageOpen(null, redirectTo);
			Storage.delete('redirectTo');
		};

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
		DataUtil.pageOpen(e, blockStore.profile);
	};
	
	onSelect (e: any, block: I.Block) {
		e.persist();

		if (block.content.style == I.LinkStyle.Archive) {
			commonStore.popupOpen('archive', {});
		} else {
			crumbs.cut(I.CrumbsType.Page, 0, () => {
				DataUtil.pageOpen(e, block.content.targetBlockId);
			});
		};
	};
	
	onAdd (e: any) {
		const { root } = blockStore;
		const details = { 
			iconEmoji: SmileUtil.random(), 
			name: '',
		};
		
		DataUtil.pageCreate(e, root, '', details, I.BlockPosition.Bottom, (message: any) => {
			Util.scrollTopEnd();
		});
	};

	onMore (e: any, item: any) {
		e.stopPropagation();

		const { match } = this.props;
		const { root } = blockStore;
		const node = $(ReactDOM.findDOMNode(this));

		commonStore.menuOpen('blockMore', { 
			element: '#button-' + item.id + '-more',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 8,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			className: 'fromIndex',
			data: {
				rootId: root,
				skipId: item.content.targetBlockId,
				blockId: item.id,
				blockIds: [ item.id ],
				match: match
			},
			onOpen: () => {
				raf(() => {
					node.find('#item-' + item.id).addClass('active');
				});
			},
			onClose: () => {
				node.find('#item-' + item.id).removeClass('active');
			}
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
		const { config } = commonStore;

		return blockStore.getChildren(root, root, (it: any) => {
			const details = blockStore.getDetails(root, it.content.targetBlockId);
			if (!config.allowDataview && (it.content.style == I.LinkStyle.Dataview)) {
				return false;
			};
			return !details.isArchived;
		});
	};

};

export default PageMainIndex;