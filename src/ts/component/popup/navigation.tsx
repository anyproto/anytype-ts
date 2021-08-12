import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Button, Cover, Loader, IconObject } from 'ts/component';
import { I, C, Util, DataUtil, crumbs, keyboard, Key, focus, translate } from 'ts/lib';
import { commonStore, blockStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Popup {
	history: any;
}

interface State {
	pageId: string;
	loading: boolean;
	info: I.PageInfo;
	pagesIn: I.PageInfo[];
	pagesOut: I.PageInfo[];
	n: number;
}

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');
const HEIGHT = 96;

enum Panel { 
	Left = 1, 
	Center = 2, 
	Right = 3,
}

const PopupNavigation = observer(class PopupNavigation extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		pageId: '',
		loading: false,
		info: null,
		pagesIn: [] as I.PageInfo[],
		pagesOut: [] as I.PageInfo[],
		n: 0,
	};
	timeout: number = 0;
	panel: Panel = Panel.Left;
	cacheIn: any = {};
	cacheOut: any = {};
	focus: boolean = false;
	select: boolean = false;
	
	constructor (props: any) {
		super (props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onOver = this.onOver.bind(this);
	};
	
	render () {
		const { pageId, info, pagesIn, pagesOut, loading, n } = this.state;
		const { param, close } = this.props;
		const { data } = param;
		const { type } = data;
		const { root } = blockStore;
		const isRoot = pageId == root;

		let confirm = '';
		let iconHome = (
			<div className="iconObject isRelation c48">
				<div className="iconEmoji c48">
					<Icon className="home-big" />
				</div>
			</div>
		);

		switch (type) {
			default:
			case I.NavigationType.Go:
				confirm = translate('popupNavigationOpen');
				break;

			case I.NavigationType.Move:
				confirm = translate('popupNavigationMove');
				break;

			case I.NavigationType.Link:
				confirm = translate('popupNavigationLink');
				break;
		};

		const Item = (item: any) => {
			let { name } = item.details || {};
			let isRoot = item.id == root;

			return (
				<div id={'item-' + item.id} className="item" onMouseOver={(e: any) => { this.onOver(e, item); }}>
					<div className="inner" onClick={(e: any) => { this.onClick(e, item); }}>
						{isRoot ? iconHome : <IconObject object={item.details} size={48} /> }
						<div className="info">
							<div className="name">{name}</div>
							<div className="descr">{item.snippet}</div>
						</div>
					</div>
					<Icon className="arrow" />
				</div>
			);
		};

		const rowRenderer = (list: I.PageInfo[], cache: any, { index, key, style, parent, panel }) => {
			return (
				<CellMeasurer
					key={key}
					parent={parent}
					cache={cache}
					columnIndex={0}
					rowIndex={index}
					hasFixedWidth={() => {}}
				>
					<div className="row" style={style}>
						<Item {...list[index]} index={index} panel={panel} />
					</div>
				</CellMeasurer>
			);
		};

		const ItemEmpty = (item: any) => {
			return (
				<div className="row">
					<div className="item empty">
						<div className="name">{item.name}</div>
						<Icon className="arrow" />
					</div>
				</div>
			);
		};

		const Selected = (item: any) => {
			let { name, coverType, coverId, coverX, coverY, coverScale } = item.details;
			let isRoot = item.id == root;
			let icon = null;
			let withScale = true;
			let withButtons = this.withButtons(item);

			if (isRoot) {
				icon = iconHome;
				name = 'Home';
				
				if (!coverId && !coverType) {
					coverId = 'c' + Constant.default.cover;
					coverType = I.CoverType.Image;
				};
				withScale = false;
			} else {
				icon = <IconObject object={item.details} size={48} />
			};

			return (
				<div id={'item-' + item.id} className="selected">
					{icon}
					<div className="name">{name}</div>
					<div className="descr">{item.snippet}</div>
					{coverId && coverType ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={withScale} /> : ''}
					{withButtons ? (
						<div className="buttons">
							<Button text={confirm} onClick={(e: any) => { this.onConfirm(e, item); }} />
							<Button text={translate('popupNavigationCancel')} color="blank" onClick={(e: any) => { close(); }} />
						</div>
					) : ''}
				</div>
			);
		};

		return (
			<div>
				{loading ? <Loader /> : ''}
				<div key="sides" className="sides">
					<div id={'panel-' + Panel.Left} className="items left">
						{!isRoot ? (
							<React.Fragment>
								<div className="sideName">{translate('popupNavigationLinkFrom')}</div>
								{!pagesIn.length ? (
									<ItemEmpty name={translate('popupNavigationEmptyTo')} />
								) : (
									<InfiniteLoader
										rowCount={pagesIn.length}
										loadMoreRows={() => {}}
										isRowLoaded={({ index }) => index < pagesIn.length}
									>
										{({ onRowsRendered, registerChild }) => (
											<AutoSizer className="scrollArea">
												{({ width, height }) => (
													<List
														ref={registerChild}
														width={width + 20}
														height={height - 35}
														deferredMeasurmentCache={this.cacheIn}
														rowCount={pagesIn.length}
														rowHeight={HEIGHT}
														rowRenderer={(param: any) => { 
															param.panel = Panel.Left;
															return rowRenderer(pagesIn, this.cacheIn, param); 
														}}
														onRowsRendered={onRowsRendered}
														overscanRowCount={10}
														scrollToIndex={this.panel == Panel.Left ? n : 0}
													/>
												)}
											</AutoSizer>
										)}
									</InfiniteLoader>
								)}
							</React.Fragment>
						) : ''}
					</div>

					<div id={'panel-' + Panel.Center} className="items center">
						{info ? <Selected {...info} /> : ''}
					</div>

					<div id={'panel-' + Panel.Right} className="items right">
						<div className="sideName">{translate('popupNavigationLinkTo')}</div>
						{!pagesOut.length ? (
							<ItemEmpty name={translate('popupNavigationEmptyFrom')} />
						) : (
							<InfiniteLoader
								rowCount={pagesOut.length}
								loadMoreRows={() => {}}
								isRowLoaded={({ index }) => index < pagesOut.length}
							>
								{({ onRowsRendered, registerChild }) => (
									<AutoSizer className="scrollArea">
										{({ width, height }) => (
											<List
												ref={registerChild}
												width={width + 20}
												height={height - 35}
												deferredMeasurmentCache={this.cacheOut}
												rowCount={pagesOut.length}
												rowHeight={HEIGHT}
												rowRenderer={(param: any) => { 
													param.panel = Panel.Right;
													return rowRenderer(pagesOut, this.cacheOut, param); 
												}}
												onRowsRendered={onRowsRendered}
												overscanRowCount={10}
												scrollToIndex={this.panel == Panel.Right ? n : 0}
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>
						)}
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		this._isMounted = true;

		crumbs.addPage(rootId);
		this.setState({ pageId: rootId });
		this.loadPage(rootId);

		this.resize();
		this.rebind();
		focus.clear(true);
	};
	
	componentDidUpdate (prevProps: any, prevState: any) {
		const { pagesIn, pagesOut } = this.state;

		this.resize();
		this.setActive();

		this.cacheIn = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (pagesIn[i] || {}).id; },
		});

		this.cacheOut = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (pagesOut[i] || {}).id; },
		});
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeout);
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.on('keydown.navigation', (e: any) => { this.onKeyDown(e); });
		win.unbind('resize.navigation').on('resize.navigation', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('keydown.navigation resize.navigation');
	};
	
	resize () {
		if (!this._isMounted) {
			return;
		};

		const platform = Util.getPlatform();
		const { position } = this.props;

		raf(() => {
			const win = $(window);
			const obj = $('#popupNavigation #innerWrap');
			const items = obj.find('.items');
			const sides = obj.find('.sides');
			const empty = obj.find('#empty');
			const offset = 32;
			const wh = win.height();
			const ww = win.width();
			
			let oh = wh - 70;
			if ([ I.Platform.Windows ].indexOf(platform) >= 0) {
				oh -= 16;
			};

			let sh = oh - offset;
			let width = Math.min(1136, Math.max(896, ww - 128));

			sides.css({ height: sh });
			items.css({ height: sh });
			empty.css({ height: sh, lineHeight: sh + 'px' });
			obj.css({ width: width, marginLeft: -width / 2, height: oh });

			position();
		});
	};
	
	onKeyDown (e: any) {
		const items = this.getItems();
		const l = items.length;

		let { n } = this.state;
		let k = e.key.toLowerCase();

		keyboard.disableMouse(true);

		e.preventDefault();
		e.stopPropagation();

		switch (k) {
			case Key.up:
				n--;
				if (n < 0) {
					n = l - 1;
				};
				this.setState({ n: n });
				this.setActive();
				break;
				
			case Key.down:
				n++;
				if (n > l - 1) {
					n = 0;
				};
				this.setState({ n: n });
				this.setActive();
				break;

			case Key.left:
				this.setState({ n: 0 });
				this.panel--;
				if (this.panel < Panel.Left) {
					this.panel = Panel.Right;
				};

				if ((this.panel == Panel.Left) && !this.getItems().length) {
					this.panel = Panel.Right;
				};
				if ((this.panel == Panel.Right) && !this.getItems().length) {
					this.panel = Panel.Center;
				};

				this.setActive();
				break;
				
			case Key.right:
				this.setState({ n: 0 });
				this.panel++;
				if (this.panel > Panel.Right) {
					this.panel = Panel.Left;
				};
				
				if ((this.panel == Panel.Left) && !this.getItems().length) {
					this.panel = Panel.Center;
				};
				if ((this.panel == Panel.Right) && !this.getItems().length) {
					this.panel = Panel.Left;
				};

				this.setActive();
				break;
				
			case Key.enter:
			case Key.space:
				const item = items[n];
				if (!item) {
					break;
				};

				if (this.panel == Panel.Center) {
					this.onConfirm(e, item);
				} else {
					this.loadPage(item.id);
				};
				break;
				
			case Key.escape:
				this.props.close();
				break;
		};
	};

	getItems () {
		const { info, pagesIn, pagesOut } = this.state;

		switch (this.panel) {
			case Panel.Left:
				return pagesIn;
			
			case Panel.Center:
				return [ info ];

			case Panel.Right:
				return pagesOut;
		};
	};

	setActive (item?: any) {
		const { n } = this.state;
		if (!item) {
			const items = this.getItems();
			item = items[n];
		};

		if (!item) {
			return;
		};

		if (item.panel) {
			this.panel = item.panel;
		};

		this.unsetActive();
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find(`#panel-${this.panel} #item-${item.id}`).addClass('active');
	};

	unsetActive () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.active').removeClass('active');
	};

	onOver (e: any, item: any) {
		const { n } = this.state;
		
		if (!keyboard.isMouseDisabled && ((item.panel != this.panel) || (item.index != n))) {
			this.panel = item.panel;
			this.setState({ n: item.index });
		};
	};

	loadPage (id: string) {
		const { config } = commonStore;
		const filter = (it: I.PageInfo) => { return this.filterMapper(it, config); };

		this.setState({ loading: true });
		crumbs.addPage(id);

		C.NavigationGetObjectInfoWithLinks(id, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			let pagesIn = message.object.links.inbound.map((it: any) => { return this.getPage(it); });
			let pagesOut = message.object.links.outbound.map((it: any) => { return this.getPage(it); });

			pagesIn = pagesIn.filter(filter);
			pagesOut = pagesOut.filter(filter);

			this.panel = Panel.Center;
			this.setState({ 
				n: 0,
				pageId: id,
				loading: false,
				info: this.getPage(message.object.info),
				pagesIn: pagesIn,
				pagesOut: pagesOut,
			});
		});
	};

	filterMapper (it: I.PageInfo, config: any) {
		const object = it.details;
		if (object.isArchived) {
			return false;
		};

		if (!config.allowDataview) {
			if (object.type == Constant.typeId.template) {
				return false;
			};
			if ([ I.ObjectLayout.Page, I.ObjectLayout.Dashboard ].indexOf(object.layout) < 0) {
				return false;
			};
		};
		return true;
	};

	onClick (e: any, item: I.PageInfo) {
		e.stopPropagation();
		this.loadPage(item.id);
	};

	onConfirm (e: any, item: I.PageInfo) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, type, blockId, blockIds, position } = data;

		if (!this.withButtons(item)) {
			return;
		};

		let newBlock: any = {};

		switch (type) {
			case I.NavigationType.Go:
				crumbs.cut(I.CrumbsType.Page, 0, () => {
					DataUtil.objectOpenEvent(e, { id: item.id });
				});
				break;

			case I.NavigationType.Move:
				C.BlockListMove(rootId, item.id, blockIds, '', I.BlockPosition.Bottom);
				break;

			case I.NavigationType.Link:
				newBlock = {
					type: I.BlockType.Link,
					content: {
						targetBlockId: String(item.id || ''),
					}
				};
				C.BlockCreate(param, rootId, blockId, position);
				break;

			case I.NavigationType.LinkTo:
				newBlock = {
					type: I.BlockType.Link,
					content: {
						targetBlockId: blockId,
					}
				};
				C.BlockCreate(newBlock, item.id, '', position);
				break;
		};

		close();
	};

	withButtons (item: I.PageInfo) {
		const { param } = this.props;
		const { data } = param;
		const { type, rootId, blockId, blockIds } = data;
		const { root } = blockStore;

		let isRoot = item.id == root;
		let isSelf = (item.id == rootId) || (item.id == blockId);
		let ret = true;

		if (isSelf && ([ I.NavigationType.Move, I.NavigationType.Link ].indexOf(type) >= 0)) {
			ret = false;
		};

		if (isRoot && ([ I.NavigationType.Move, I.NavigationType.Link ].indexOf(type) >= 0)) {
			ret = false;
		};

		if (type == I.NavigationType.Move) {
			for (let id of blockIds) {
				let block = blockStore.getLeaf(rootId, id);
				if (isRoot && (block.type != I.BlockType.Link)) {
					ret = false;
					break;
				};
				if ((block.type == I.BlockType.Link) && (item.id == block.content.targetBlockId)) {
					ret = false;
					break;
				};
			};
		};

		return ret;
	};
	
	getPage (page: any): I.PageInfo {
		page.details.name = String(page.details.name || DataUtil.defaultName('page'));

		return {
			...page,
			text: [ page.details.name, page.snippet ].join(' '),
		};
	};
	
});

export default PopupNavigation;