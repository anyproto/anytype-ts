import React, { forwardRef, useRef, useState, useEffect } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Button, Cover, Loader, IconObject, Header, Footer, ObjectName, ObjectDescription } from 'Component';
import { I, C, S, U, keyboard, focus, translate } from 'Lib';

import Item from 'Component/page/main/navigation/item';

enum Panel { 
	Left = 1, 
	Center = 2, 
	Right = 3,
};

const HEIGHT = 88;

const PageMainNavigation = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const [ dummy, setDummy ] = useState(0);
	const dataRef = useRef({ 
		[Panel.Center]: null, 
		[Panel.Left]: [] as I.PageInfo[], 
		[Panel.Right]: [] as I.PageInfo[],
	});
	const [ isLoading, setIsLoading ] = useState(false);
	const nodeRef = useRef(null);
	const headerRef = useRef(null);
	const listRef = useRef({ [Panel.Left]: null, [Panel.Right]: null });
	const nRef = useRef(0);
	const panelRef = useRef(Panel.Left);
	const timeoutRef = useRef(0);
	const idRef = useRef('');
	const cache = useRef({
		[Panel.Left]: new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }),
		[Panel.Right]: new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }),
	});

	const rebind = () => {
		unbind();
		$(window).on('keydown.navigation', e => onKeyDown(e));
	};

	const unbind = () => {
		$(window).off('keydown.navigation');
	};
	
	const resize = () => {
		const node = $(nodeRef.current);

		raf(() => {
			const container = U.Common.getScrollContainer(isPopup);
			const header = node.find('#header');
			const items = node.find('.items');
			const sides = node.find('.sides');
			const empty = node.find('#empty');
			const hh = header.height();
			const oh = container.height() - hh;

			sides.css({ height: oh });
			items.css({ height: oh });
			empty.css({ height: oh, lineHeight: oh + 'px' });
		});
	};
	
	const onKeyDown = (e: any) => {
		if (S.Popup.isOpen('search')) {
			return;
		};

		const items = getItems();
		const l = items.length;

		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			const dir = pressed == 'arrowup' ? -1 : 1;

			nRef.current += dir;
			if (nRef.current < 0) {
				nRef.current = l - 1;
			};
			if (nRef.current > l - 1) {
				nRef.current = 0;
			};
			
			listRef.current[panelRef.current]?.scrollToRow(nRef.current);
			window.setTimeout(() => setActive(), 0);
		});

		keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
			const dir = pressed == 'arrowleft' ? -1 : 1;

			panelRef.current += dir;

			if (panelRef.current < Panel.Left) {
				panelRef.current = Panel.Right;
			};

			if ((panelRef.current == Panel.Left) && !getItems().length) {
				panelRef.current = Panel.Right;
			};
			if ((panelRef.current == Panel.Right) && !getItems().length) {
				panelRef.current = Panel.Center;
			};

			if (panelRef.current > Panel.Right) {
				panelRef.current = Panel.Left;
			};
			
			if ((panelRef.current == Panel.Left) && !getItems().length) {
				panelRef.current = Panel.Center;
			};
			if ((panelRef.current == Panel.Right) && !getItems().length) {
				panelRef.current = Panel.Left;
			};

			setActive();
		});

		keyboard.shortcut('enter, space', e, () => {
			const item = items[nRef.current];
			if (item) {
				U.Object.openAuto({ ...item, layout: (panelRef.current == Panel.Center) ? item.layout : I.ObjectLayout.Navigation });
			};
		});
	};

	const getItems = () => {
		switch (panelRef.current) {
			default:
				return dataRef.current[panelRef.current];
			
			case Panel.Center:
				return [ dataRef.current[Panel.Center] ];
		};
	};

	const setActive = (item?: any) => {
		if (!item) {
			const items = getItems();
			item = items[nRef.current];
		};

		if (!item) {
			return;
		};

		if (item.panel) {
			panelRef.current = item.panel;
		};

		unsetActive();
		$(nodeRef.current).find(`#panel-${panelRef.current} #item-${item.id}`).addClass('active');
	};

	const unsetActive = () => {
		$(nodeRef.current).find('.items .item.active').removeClass('active');
	};

	const onOver = (item: any) => {
		if (!keyboard.isMouseDisabled) {
			panelRef.current = item.panel;
			nRef.current = item.index;
			setActive();
		};
	};

	const loadPage = (id: string) => {
		const skipIds = U.Space.getSystemDashboardIds();

		if (!id || skipIds.includes(id as any)) {
			return;
		};

		if ((idRef.current == id) || isLoading) {
			return;
		};

		idRef.current = id;
		setIsLoading(true);

		C.NavigationGetObjectInfoWithLinks(id, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				return;
			};

			panelRef.current = Panel.Center;

			dataRef.current = {
				[Panel.Center]: getPage(message.object.info),
				[Panel.Left]: S.Record.checkHiddenObjects(message.object.links.inbound.map(getPage)).filter(filterMapper),
				[Panel.Right]: S.Record.checkHiddenObjects(message.object.links.outbound.map(getPage)).filter(filterMapper),
			};
			setDummy(dummy + 1);
		});
	};

	const filterMapper = (it: any) => {
		return it.id && !it.isDeleted;
	};

	const getPage = (item: any) => {
		return { ...S.Detail.mapper(item.details) };
	};

	const onClick = (e: any, item: I.PageInfo) => {
		e.stopPropagation();

		U.Object.openAuto({ id: item.id, layout: I.ObjectLayout.Navigation });
	};

	const onConfirm = (e: any, item: I.PageInfo) => {
		if (e.persist) {
			e.persist();
		};

		U.Object.openConfig(e, item);
	};

	const getRootId = () => {
		let root = keyboard.getRootId(isPopup);
		if (root == I.HomePredefinedId.Graph) {
			root = U.Space.getLastOpened()?.id;
		};
		return root;
	};

	const onTab = (id: string) => {
		const tab = U.Menu.getGraphTabs().find(it => it.id == id);

		if (tab) {
			U.Object.openAuto({ id: getRootId(), layout: tab.layout });
		};
	};

	const rowRenderer = (list: I.PageInfo[], cache: any, { index, key, style, parent, panel }) => {
		const item: any = list[index];

		item.index = index;
		item.panel = panel;

		return (
			<CellMeasurer
				key={key}
				parent={parent}
				cache={cache}
				columnIndex={0}
				rowIndex={index}
			>
				<div className="row" style={style}>
					<Item 
						item={item}
						onClick={e => onClick(e, item)}
						onMouseEnter={() => onOver(item)}
						onMouseLeave={unsetActive}
					/>
				</div>
			</CellMeasurer>
		);
	};

	const ItemEmpty = (item: any) => (
		<div className="row">
			<div className="item empty">
				<div className="name">{item.name}</div>
			</div>
		</div>
	);

	const Selected = (item: any) => {
		const { id, name, layout, snippet, coverType, coverId, coverX, coverY, coverScale } = item;
		const isFile = U.Object.isInFileLayouts(layout);
		const cn = [ 'item', U.Data.layoutClass(id, layout), 'selected' ];
		const iconSize = isFile ? 48 : null;

		let description = null;
		if (isFile) {
			cn.push('isFile');
			description = <div className="descr">{U.File.size(item.sizeInBytes)}</div>;
		} else {
			description = <ObjectDescription object={item} />;
		};

		return (
			<div id={`item-${id}`} className={cn.join(' ')}>
				<IconObject object={item} size={48} iconSize={iconSize} />
				<ObjectName object={item} withPlural={true} />
				{description}
				
				{coverId && coverType ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} /> : ''}
			
				<div className="buttons">
					<Button text={translate('popupNavigationOpen')} className="c36" onClick={e => onConfirm(e, item)} />
					{isPopup ? <Button text={translate('popupNavigationCancel')} className="c36" color="blank" onClick={() => S.Popup.close('page')} /> : ''}
				</div>
			</div>
		);
	};

	const info = dataRef.current[Panel.Center];
	const pagesIn = dataRef.current[Panel.Left];
	const pagesOut = dataRef.current[Panel.Right];
	const rootId = getRootId();

	useEffect(() => {
		loadPage(rootId);
		resize();
		rebind();

		focus.clear(true);
		keyboard.setFocus(true);

		return () => {
			unbind();

			window.clearTimeout(timeoutRef.current);
			keyboard.setFocus(false);
		};
	}, []);
	
	useEffect(() => {
		loadPage(rootId);
		resize();
		setActive();
	}, [ rootId ]);
	
	return (
		<div 
			ref={nodeRef} 
			className="wrapper"
		>
			<Header 
				{...props} 
				ref={headerRef} 
				component="mainNavigation" 
				rootId={rootId} 
				tabs={U.Menu.getGraphTabs()} 
				tab="navigation" 
				onTab={onTab}
				layout={I.ObjectLayout.Navigation}
			/>

			{isLoading ? <Loader id="loader" fitToContainer={true} isPopup={isPopup} /> : ''}

			<div key="sides" className="sides">
				<div id={`panel-${Panel.Left}`} className="items left customScrollbar">
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
											ref={ref => listRef.current[Panel.Left] = ref}
											width={width}
											height={height - 35}
											deferredMeasurmentCache={cache.current[Panel.Left]}
											rowCount={pagesIn.length}
											rowHeight={HEIGHT}
											rowRenderer={(param: any) => { 
												param.panel = Panel.Left;
												return rowRenderer(pagesIn, cache.current[Panel.Left], param); 
											}}
											onRowsRendered={onRowsRendered}
											overscanRowCount={10}
											scrollToAlignment="center"
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					)}
				</div>

				<div id={`panel-${Panel.Center}`} className="items center">
					{info ? <Selected {...info} /> : <ItemEmpty name={translate('pageMainNavigationItemEmptyTitle')} />}
				</div>

				<div id={`panel-${Panel.Right}`} className="items right customScrollbar">
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
											ref={ref => listRef.current[Panel.Right] = ref}
											width={width}
											height={height - 35}
											deferredMeasurmentCache={cache.current[Panel.Right]}
											rowCount={pagesOut.length}
											rowHeight={HEIGHT}
											rowRenderer={(param: any) => { 
												param.panel = Panel.Right;
												return rowRenderer(pagesOut, cache.current[Panel.Right], param); 
											}}
											onRowsRendered={onRowsRendered}
											overscanRowCount={10}
											scrollToAlignment="center"
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
	
}));

export default PageMainNavigation;