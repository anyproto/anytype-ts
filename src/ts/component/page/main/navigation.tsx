import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { observer } from 'mobx-react';
import { Icon, Button, Cover, Loader, IconObject, Header, Footer, ObjectName, ObjectDescription } from 'Component';
import { I, C, UtilObject, UtilCommon, UtilMenu, keyboard, Key, focus, translate } from 'Lib';
import { blockStore, popupStore, commonStore } from 'Store';

interface State {
	loading: boolean;
	info: I.PageInfo;
	pagesIn: I.PageInfo[];
	pagesOut: I.PageInfo[];
};

const HEIGHT = 96;

enum Panel { 
	Left = 1, 
	Center = 2, 
	Right = 3,
};

const PageMainNavigation = observer(class PageMainNavigation extends React.Component<I.PageComponent, State> {
	
	_isMounted = false;
	node: any = null;
	state = {
		loading: false,
		info: null,
		pagesIn: [] as I.PageInfo[],
		pagesOut: [] as I.PageInfo[],
	};
	id = '';
	n = 0;
	timeout = 0;
	panel: Panel = Panel.Left;
	cacheIn: any = {};
	cacheOut: any = {};
	focus = false;
	select = false;
	refHeader: any = null;
	
	constructor (props: I.PageComponent) {
		super (props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onTab = this.onTab.bind(this);
	};
	
	render () {
		const { isPopup } = this.props;
		const { info, pagesIn, pagesOut, loading } = this.state;
		const rootId = this.getRootId();

		const iconHome = (
			<div className="iconObject isRelation c48">
				<div className="iconEmoji c48">
					<Icon className="home-big" />
				</div>
			</div>
		);

		const Item = (item: any) => {
			let { layout, name, description, snippet } = item || {};

			return (
				<div 
					id={'item-' + item.id} 
					className="item" 
					onMouseEnter={e => this.onOver(e, item)}
					onMouseLeave={() => this.unsetActive()}
				>
					<div className="inner" onClick={e => this.onClick(e, item)}>
						{item.isRoot ? iconHome : <IconObject object={item} forceLetter={true} size={48} iconSize={24} />}
						<div className="info">
							<ObjectName object={item} />
							<ObjectDescription object={item} />
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
			const { name, description, layout, snippet, coverType, coverId, coverX, coverY, coverScale } = item;

			return (
				<div id={'item-' + item.id} className="selected">
					<IconObject object={item} forceLetter={true} size={48} />
					<ObjectName object={item} />
					<ObjectDescription object={item} />
					
					{coverId && coverType ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} /> : ''}
				
					<div className="buttons">
						<Button text={translate('popupNavigationOpen')} className="c36" onClick={(e: any) => { this.onConfirm(e, item); }} />
						{isPopup ? <Button text={translate('popupNavigationCancel')} className="c36" color="blank" onClick={() => { popupStore.close('page'); }} /> : ''}
					</div>
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node} 
				className="wrapper"
			>
				<Header 
					{...this.props} 
					ref={ref => this.refHeader = ref} 
					component="mainNavigation" 
					rootId={rootId} 
					tabs={UtilMenu.getGraphTabs()} 
					tab="navigation" 
					onTab={this.onTab} 
				/>

				{loading ? <Loader id="loader" /> : ''}
				<div key="sides" className="sides">
					<div id={'panel-' + Panel.Left} className="items left">
						<div className="sideName">{translate('popupNavigationLinkTo')}</div>
						{!pagesIn.length ? (
							<ItemEmpty name={translate('popupNavigationEmptyTo')} />
						) : (
							<InfiniteLoader
								rowCount={pagesIn.length}
								loadMoreRows={() => {}}
								isRowLoaded={({ index }) => !!pagesIn[index]}
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
												scrollToAlignment="start"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>
						)}
					</div>

					<div id={'panel-' + Panel.Center} className="items center">
						{info ? <Selected {...info} /> : <ItemEmpty name={translate('pageMainNavigationItemEmptyTitle')} />}
					</div>

					<div id={'panel-' + Panel.Right} className="items right">
						<div className="sideName">{translate('popupNavigationLinkFrom')}</div>
						{!pagesOut.length ? (
							<ItemEmpty name={translate('popupNavigationEmptyFrom')} />
						) : (
							<InfiniteLoader
								rowCount={pagesOut.length}
								loadMoreRows={() => {}}
								isRowLoaded={({ index }) => !!pagesOut[index]}
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
												scrollToAlignment="start"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>
						)}
					</div>
				</div>

				<Footer component="mainObject" />
			</div>
		);
	};
	
	componentDidMount () {
		const rootId = this.getRootId();

		this._isMounted = true;
		this.loadPage(rootId);
		this.resize();
		this.rebind();

		focus.clear(true);
		keyboard.setFocus(true);
	};
	
	componentDidUpdate () {
		const rootId = this.getRootId();
		const { pagesIn, pagesOut } = this.state;

		this.loadPage(rootId);

		this.cacheIn = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (pagesIn[i] || {}).id,
		});

		this.cacheOut = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (pagesOut[i] || {}).id,
		});

		this.resize();
		this.setActive();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		window.clearTimeout(this.timeout);
		keyboard.setFocus(false);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.navigation', (e: any) => { this.onKeyDown(e); });
	};

	unbind () {
		$(window).off('keydown.navigation');
	};
	
	resize () {
		if (!this._isMounted) {
			return;
		};

		const { isPopup } = this.props;
		const node = $(this.node);

		raf(() => {
			const container = UtilCommon.getScrollContainer(isPopup);
			const header = node.find('#header');
			const items = node.find('.items');
			const sides = node.find('.sides');
			const empty = node.find('#empty');
			const hh = header.height();
			const oh = container.height() - hh;

			node.css({ paddingTop: isPopup ? 0 : hh });
			sides.css({ height: oh });
			items.css({ height: oh });
			empty.css({ height: oh, lineHeight: oh + 'px' });
		});
	};
	
	onKeyDown (e: any) {
		const items = this.getItems();
		const l = items.length;

		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			const dir = pressed.match(Key.up) ? -1 : 1;

			this.n += dir;
			if (this.n < 0) {
				this.n = l - 1;
			};
			if (this.n > l - 1) {
				this.n = 0;
			};
			this.setActive();
		});

		keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
			const dir = pressed.match(Key.left) ? -1 : 1;

			this.panel += dir;

			if (this.panel < Panel.Left) {
				this.panel = Panel.Right;
			};

			if ((this.panel == Panel.Left) && !this.getItems().length) {
				this.panel = Panel.Right;
			};
			if ((this.panel == Panel.Right) && !this.getItems().length) {
				this.panel = Panel.Center;
			};

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
		});

		keyboard.shortcut('enter, space', e, (pressed: string) => {
			const item = items[this.n];
			if (!item) {
				return;
			};

			if (this.panel == Panel.Center) {
				this.onConfirm(e, item);
			} else {
				this.loadPage(item.id);
			};
		});
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
		if (!item) {
			const items = this.getItems();
			item = items[this.n];
		};

		if (!item) {
			return;
		};

		if (item.panel) {
			this.panel = item.panel;
		};

		this.unsetActive();
		
		const node = $(this.node);
		node.find(`#panel-${this.panel} #item-${item.id}`).addClass('active');
	};

	unsetActive () {
		const node = $(this.node);
		node.find('.items .item.active').removeClass('active');
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.panel = item.panel;
			this.n = item.index;
			this.setActive();
		};
	};

	loadPage (id: string) {
		const { loading } = this.state;

		if ((this.id == id) || loading) {
			return;
		};

		this.id = id;
		this.setState({ loading: true });

		C.NavigationGetObjectInfoWithLinks(id, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			let pagesIn = message.object.links.inbound.map(this.getPage);
			let pagesOut = message.object.links.outbound.map(this.getPage);

			pagesIn = pagesIn.filter(this.filterMapper);
			pagesOut = pagesOut.filter(this.filterMapper);

			this.panel = Panel.Center;
			this.setState({ 
				loading: false,
				info: this.getPage(message.object.info),
				pagesIn: pagesIn,
				pagesOut: pagesOut,
			});
		});
	};

	filterMapper (it: any) {
		const { config } = commonStore;

		if (!it.id) {
			return false;
		};

		let ret = !it.isArchived && !it.isDeleted;
		if (!config.debug.ho) {
			ret = ret && !it.isHidden;
		};
		return ret;
	};

	getPage (item: any) {
		return { ...item.details };
	};

	onClick (e: any, item: I.PageInfo) {
		e.stopPropagation();

		const { isPopup } = this.props;
		const obj = { id: item.id, layout: I.ObjectLayout.Navigation };

		isPopup ? UtilObject.openPopup(obj) : UtilObject.openRoute(obj);
	};

	onConfirm (e: any, item: I.PageInfo) {
		if (e.persist) {
			e.persist();
		};

		UtilObject.openEvent(e, item);
	};

	getRootId () {
		const { rootId, match } = this.props;

		let root = rootId ? rootId : match.params.id;
		if (root == I.HomePredefinedId.Graph) {
			root = UtilObject.lastOpened()?.id;
		};
		return root;
	};

	onTab (id: string) {
		const tab = UtilMenu.getGraphTabs().find(it => it.id == id);

		if (tab) {
			UtilObject.openAuto({ id: this.getRootId(), layout: tab.layout });
		};
	};

});

export default PageMainNavigation;
