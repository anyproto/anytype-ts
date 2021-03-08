import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject, ListIndex, Cover, HeaderMainIndex as Header, FooterMainIndex as Footer } from 'ts/component';
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
					<div className="title">
						<span id="hello">{details.name ? Util.sprintf(translate('indexHi'), Util.shorten(details.name, 24)) : ''}</span>
						
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
		const node = $(ReactDOM.findDOMNode(this));
		const hello = node.find('#hello');
		const redirectTo = Storage.get('redirectTo');

		Storage.delete('redirect');

		if (redirectTo) {
			history.push(redirectTo);
			Storage.delete('redirectTo');
		};

		crumbs.delete(I.CrumbsType.Page);

		/*
		if (Storage.get('hello')) {
			hello.remove();
		} else {
			window.setTimeout(() => {
				Storage.set('hello', 1);
				hello.addClass('hide');
			}, 5000);
		};
		*/
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
		const object = blockStore.getDetails(blockStore.profile, blockStore.profile);

		DataUtil.objectOpen(object);
	};
	
	onSelect (e: any, block: I.Block) {
		e.persist();

		const { root } = blockStore;
		const object = blockStore.getDetails(root, block.content.targetBlockId);

		if (block.content.style == I.LinkStyle.Archive) {
			commonStore.popupOpen('archive', {});
		} else {
			crumbs.cut(I.CrumbsType.Page, 0, () => {
				DataUtil.objectOpenEvent(e, object);
			});
		};
	};

	onStore (e: any) {
		commonStore.popupOpen('store', {});
	};
	
	onAdd (e: any) {
		const { history } = this.props;
		const { root } = blockStore;
		const { config } = commonStore;

		const options = [
			{ id: 'page', icon: 'page', name: 'Draft' },
			{ id: 'link', icon: 'existing', name: 'Link to object' },
		];

		if (config.allowDataview) {
			options.push({ id: 'set', icon: 'set', name: 'New set' });
		};

		commonStore.menuOpen('select', { 
			element: '#button-add',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			width: 176,
			data: {
				value: '',
				options: options,
				onSelect: (event: any, item: any) => {
					if (item.id == 'page') {
						DataUtil.pageCreate(e, root, '', { iconEmoji: SmileUtil.random() }, I.BlockPosition.Bottom, (message: any) => {
							DataUtil.objectOpen({ id: message.targetId });
						});
					};

					if (item.id == 'link') {
						commonStore.popupOpen('search', { 
							preventResize: true,
							data: { 
								type: I.NavigationType.Link, 
								rootId: root,
								skipId: root,
								blockId: '',
								position: I.BlockPosition.Bottom,
							}, 
						});
					};

					if (item.id == 'set') {
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
		if (list.length > cnt) {
			height *= 2;
		};
		height += 20;
		
		items.css({ width: width }).removeClass('last');
		body.css({ width: maxWidth });
		documents.css({ marginTop: wh - 142 - height });

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