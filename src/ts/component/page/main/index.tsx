import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject, ListIndex, Cover, HeaderMainIndex as Header, FooterMainIndex as Footer } from 'ts/component';
import { commonStore, blockStore, menuStore, popupStore } from 'ts/store';
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
		this.onStore = this.onStore.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { config } = commonStore;
		const { root, profile } = blockStore;
		const element = blockStore.getLeaf(root, root);

		if (!element) {
			return null;
		};

		const details = blockStore.getDetails(profile, profile);
		const { iconImage, name } = details;
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
					<div id="title" className="title">
						{details.name ? Util.sprintf(translate('indexHi'), Util.shorten(details.name, 24)) : ''}
						
						<div className="rightMenu">
							<Icon id="button-account" menuId="account" className="account" tooltip="Accounts" onClick={this.onAccount} />
							<Icon id="button-add" className="add" tooltip="Add new object" onClick={this.onAdd} />
							{config.allowDataview ? (
								<Icon id="button-store" className="store" tooltip="Store" onClick={this.onStore} />
							) : ''}
							<IconObject object={{ ...details, layout: I.ObjectLayout.Human }} size={64} tooltip="Your profile" onClick={this.onProfile} />
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
		const { history } = this.props;
		const redirectTo = Storage.get('redirectTo');
		const win = $(window);

		Storage.delete('redirect');

		if (redirectTo) {
			history.push(redirectTo);
			Storage.delete('redirectTo');
		};

		crumbs.delete(I.CrumbsType.Page);

		this.onScroll();
		win.unbind('scroll').on('scroll', (e: any) => { this.onScroll(); });
	};
	
	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		$(window).unbind('scroll');
		menuStore.closeAll(Constant.menuIds.index);
	};

	onScroll () {
		const win = $(window);
		const top = win.scrollTop();
		const node = $(ReactDOM.findDOMNode(this));
		const title = node.find('#title');
		const list = node.find('#documents');
		if (!list.length) {
			return;
		};

		const oy = list.offset().top;
		const menu = $('#menuSelect.add');
		const offset = 256;

		let y = 0;
		if (oy - top <= offset) {
			y = oy - top - offset;
		};

		title.css({ transform: `translate3d(0px,${y}px,0px)` });
		menu.css({ transform: `translate3d(0px,${y}px,0px)`, transition: 'none' });
	};
	
	onAccount () {
		menuStore.open('account', {
			element: '#button-account',
			offsetY: 4,
			horizontal: I.MenuDirection.Right
		});
	};
	
	onProfile (e: any) {
		const { profile } = blockStore;
		const object = blockStore.getDetails(profile, profile);

		DataUtil.objectOpen(object);
	};
	
	onSelect (e: any, block: I.Block) {
		e.persist();

		const { root } = blockStore;
		const object = blockStore.getDetails(root, block.content.targetBlockId);

		if (block.content.style == I.LinkStyle.Archive) {
			popupStore.open('archive', {});
		} else {
			crumbs.cut(I.CrumbsType.Page, 0, () => {
				DataUtil.objectOpenEvent(e, object);
			});
		};
	};

	onStore (e: any) {
		popupStore.open('store', {});
	};
	
	onAdd (e: any) {
		const { history } = this.props;
		const { root } = blockStore;
		const { config } = commonStore;
		const options = [
			{ id: 'page', icon: 'page', name: 'Draft' },
			{ id: 'link', icon: 'existing', name: 'Link to object', arrow: true },
		];
		const width = 176;

		if (config.allowDataview) {
			options.push({ id: 'set', icon: 'set', name: 'New set' });
		};

		const close = () => {
			menuStore.close('select');
		};

		menuStore.open('select', { 
			element: '#button-add',
			offsetY: 4,
			horizontal: I.MenuDirection.Center,
			width: width,
			className: 'add fixed',
			data: {
				value: '',
				options: options,
				noClose: true,
				onMouseEnter: (event: any, item: any) => {
					if (!item.arrow) {
						menuStore.closeAll(Constant.menuIds.index);
						return;
					};

					if (item.id == 'link') {
						menuStore.closeAll(Constant.menuIds.index, () => {
							menuStore.open('searchObject', { 
								element: '#menuSelect #item-link',
								offsetX: width,
								offsetY: -36,
								isSub: true,
								passThrough: true,
								data: { 
									type: I.NavigationType.Link, 
									rootId: root,
									skipId: root,
									blockId: '',
									position: I.BlockPosition.Bottom,
									onSelect: (item: any) => {
										close();
									}
								}, 
							});
						});
					};
				},
				onSelect: (event: any, item: any) => {
					if (item.id == 'page') {
						DataUtil.pageCreate(e, root, '', {}, I.BlockPosition.Bottom, (message: any) => {
							DataUtil.objectOpen({ id: message.targetId });
						});

						close();
					};

					if (item.id == 'set') {
						close();
						history.push('/main/set');
					};
				},
			}
		});
	};

	onMore (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const { match } = this.props;
		const { root } = blockStore;
		const node = $(ReactDOM.findDOMNode(this));

		menuStore.open('blockMore', { 
			element: '#button-' + item.id + '-more',
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			className: 'fromIndex',
			data: {
				rootId: root,
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
		const title = node.find('#title');
		const body = node.find('#body');
		const documents = node.find('#documents');
		const items = node.find('#documents .item');

		const maxWidth = ww - size.border * 2;
		const cnt = Math.floor(maxWidth / (size.width + size.margin));
		const width = Math.floor((maxWidth - size.margin * (cnt - 1)) / cnt);
		const height = this.getListHeight();

		items.css({ width: width }).removeClass('last');
		title.css({ width: maxWidth });
		body.css({ width: maxWidth });
		documents.css({ marginTop: wh - size.titleY - height });

		items.each((i: number, item: any) => {
			item = $(item);
			const icon = item.find('.iconObject');

			if ((i + 1) >= cnt && ((i + 1) % cnt === 0) && (list.length + 1 > cnt)) {
				item.addClass('last');
			};
			if (icon.length) {
				item.addClass('withIcon');
			};
		});

		this.onScroll();
	};

	getListHeight () {
		const win = $(window);
		const ww = win.width();
		const size = Constant.size.index;
		const list = this.getList();
		const maxWidth = ww - size.border * 2;
		const cnt = Math.floor(maxWidth / (size.width + size.margin));

		let height = size.height + size.margin;
		if (list.length > cnt) {
			height *= 2;
		};

		height += 20;
		return height;
	};

	getList () {
		const { root } = blockStore;
		const { config } = commonStore;

		return blockStore.getChildren(root, root, (it: any) => {
			const object = blockStore.getDetails(root, it.content.targetBlockId);
			if (it.content.style == I.LinkStyle.Archive) {
				return true;
			};
			if (!config.allowDataview && (object.layout != I.ObjectLayout.Page)) {
				return false;
			};
			if (object.isArchived) {
				return false;
			};
			return true;
		});
	};

};

export default PageMainIndex;