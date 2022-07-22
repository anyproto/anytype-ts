import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, Button, Cover, Loader, IconObject, Header, ObjectName, ObjectDescription } from 'ts/component';
import { I, C, DataUtil, Util, keyboard, Key, focus, translate } from 'ts/lib';
import { blockStore, popupStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
	matchPopup?: any;
};

interface State {
	loading: boolean;
	info: I.PageInfo;
	pagesIn: I.PageInfo[];
	pagesOut: I.PageInfo[];
	n: number;
};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');
const HEIGHT = 96;

enum Panel { 
	Left = 1, 
	Center = 2, 
	Right = 3,
};

const PageMainNavigation = observer(class PageMainNavigation extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		loading: false,
		info: null,
		pagesIn: [] as I.PageInfo[],
		pagesOut: [] as I.PageInfo[],
		n: 0,
	};
	id: string = '';
	timeout: number = 0;
	panel: Panel = Panel.Left;
	cacheIn: any = {};
	cacheOut: any = {};
	focus: boolean = false;
	select: boolean = false;
	refHeader: any = null;
	
	constructor (props: any) {
		super (props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onOver = this.onOver.bind(this);
	};
	
	render () {
		const { isPopup } = this.props;
		const { info, pagesIn, pagesOut, loading, n } = this.state;
		const { root } = blockStore;
		const rootId = this.getRootId();
		const isRoot = rootId == root;

		let confirm = translate('popupNavigationOpen');
		let iconHome = (
			<div className="iconObject isRelation c48">
				<div className="iconEmoji c48">
					<Icon className="home-big" />
				</div>
			</div>
		);

		const Item = (item: any) => {
			let { layout, name, description, snippet } = item || {};

			return (
				<div id={'item-' + item.id} className="item" onMouseOver={(e: any) => { this.onOver(e, item); }}>
					<div className="inner" onClick={(e: any) => { this.onClick(e, item); }}>
						{item.isRoot ? iconHome : <IconObject object={item} forceLetter={true} size={48} />}
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
			let { name, description, layout, snippet, coverType, coverId, coverX, coverY, coverScale } = item;
			let icon = null;
			let withScale = true;
			let withButtons = true;

			if (item.isRoot) {
				icon = iconHome;
				withScale = false;
				
				if (!coverId && !coverType) {
					const cover = commonStore.coverGetDefault();
					coverId = cover.id;
					coverType = cover.type;
				};
			} else {
				icon = <IconObject object={item} forceLetter={true} size={48} />;
			};

			return (
				<div id={'item-' + item.id} className="selected">
					{icon}
					<ObjectName object={item} />
					<ObjectDescription object={item} />
					
					{coverId && coverType ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={withScale} /> : ''}
				
					{withButtons ? (
						<div className="buttons">
							<Button text={confirm} onClick={(e: any) => { this.onConfirm(e, item); }} />
							{isPopup ? <Button text={translate('popupNavigationCancel')} color="blank" onClick={(e: any) => { popupStore.close('page'); }} /> : ''}
						</div>
					) : ''}
				</div>
			);
		};

		return (
			<div className="wrapper">
				<Header component="mainNavigation" ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} />

				{loading ? <Loader id="loader" /> : ''}
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

		if (this.id != rootId) {
			this.id = rootId;
			this.loadPage(rootId);
			return;
		};

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
		this.unbind();

		window.clearTimeout(this.timeout);
		keyboard.setFocus(false);
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

		const { isPopup } = this.props;
		const node = $(ReactDOM.findDOMNode(this));

		raf(() => {
			const container = Util.getScrollContainer(isPopup);
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

		let { n } = this.state;
		let k = e.key.toLowerCase();

		keyboard.disableMouse(true);

		e.preventDefault();

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			const dir = pressed.match(Key.up) ? -1 : 1;

			n += dir;
			if (n < 0) {
				n = l - 1;
			};
			if (n > l - 1) {
				n = 0;
			};
			this.setState({ n });
			this.setActive();
		});

		keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
			const dir = pressed.match(Key.left) ? -1 : 1;

			this.setState({ n: 0 });
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
			const item = items[n];
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
		const filter = (it: I.PageInfo) => { return this.filterMapper(it); };

		this.setState({ loading: true });

		C.NavigationGetObjectInfoWithLinks(id, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			let pagesIn = message.object.links.inbound.map(this.getPage);
			let pagesOut = message.object.links.outbound.map(this.getPage);

			pagesIn = pagesIn.filter(filter);
			pagesOut = pagesOut.filter(filter);

			this.panel = Panel.Center;
			this.setState({ 
				n: 0,
				loading: false,
				info: this.getPage(message.object.info),
				pagesIn: pagesIn,
				pagesOut: pagesOut,
			});

			this.refHeader.forceUpdate();
		});
	};

	filterMapper (it: any) {
		const { config } = commonStore;

		let ret = !it.isArchived && !it.isDeleted;
		if (!config.debug.ho) {
			ret = ret && !it.isHidden;
		};
		if (!config.experimental) {
			ret = ret && ![ Constant.typeId.space ].includes(it.type);
		};
		return ret;
	};

	getPage (item: any) {
		const { root } = blockStore;

		item = { ...item.details };
		item.isRoot = item.id == root;

		if (item.isRoot) {
			item.name = 'Home';
		};
		return item;
	};

	onClick (e: any, item: I.PageInfo) {
		e.stopPropagation();

		const { isPopup } = this.props;
		const obj = { id: item.id, layout: I.ObjectLayout.Navigation };

		isPopup ? DataUtil.objectOpenPopup(obj) : DataUtil.objectOpen(obj);
	};

	onConfirm (e: any, item: I.PageInfo) {
		if (e.persist) {
			e.persist();
		};

		DataUtil.objectOpenEvent(e, item);
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};
	
});

export default PageMainNavigation;