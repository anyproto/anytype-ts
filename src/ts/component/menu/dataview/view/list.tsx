import * as React from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import { Icon } from 'Component';
import { I, C, S, U, keyboard, Relation, analytics, translate, Dataview } from 'Lib';

const HEIGHT = 28;
const LIMIT = 20;

const MenuViewList = observer(class MenuViewList extends React.Component<I.Menu> {
	
	_isMounted = false;
	node: any = null;
	n = -1;
	top = 0;
	refList: any = null;
	cache: any = {};
	
	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param, getId, setHover } = this.props;
		const { data } = param;
		const { loadData } = data;
		const items = this.getItems();
		const allowed = this.isAllowed();

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => (
			<div 
				id={'item-' + item.id} 
				className="item" 
				onClick={e => this.onClick(e, item)}
				onMouseEnter={e => this.onOver(e, item)}
				style={item.style}
			>
				{allowed ? <Handle /> : ''}
				<div className="clickable" onClick={() => loadData(item.id, 0)}>
					<div className="name">{item.name}</div>
				</div>
				<div className="buttons">
					<Icon className="more withBackground" onClick={e => this.onViewContext(e, item)} />
				</div>
			</div>
		));

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			let content = null;
			if (item.isSection) {
				content = <div className="sectionName" style={param.style}>{item.name}</div>;
			} else {
				content = <Item key={item.id} {...item} index={param.index - 1} style={param.style} />;
			};

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					{content}
				</CellMeasurer>
			);
		};

		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{!items.length ? (
						<div className="item empty">
							<div className="inner">{translate('menuDataviewViewListNoViewsFound')}</div>
						</div>
					) : (
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={() => {}}
							isRowLoaded={() => true}
							threshold={LIMIT}
						>
							{({ onRowsRendered }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<VList
											ref={ref => this.refList = ref}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={HEIGHT}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={LIMIT}
											onScroll={this.onScroll}
											scrollToAlignment="center"
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					)}
				</div>
			);
		});
		
		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<List 
					axis="y" 
					transitionDuration={150}
					distance={10}
					useDragHandle={true}
					onSortStart={this.onSortStart}
					onSortEnd={this.onSortEnd}
					helperClass="isDragging"
					helperContainer={() => $(`#${getId()} .items`).get(0)}
				/>

				{allowed ? (
					<div className="bottom">
						<div className="line" />
						<div 
							id="item-add" 
							className="item add" 
							onClick={this.onAdd}
							onMouseEnter={() => setHover({ id: 'add' })} 
							onMouseLeave={() => setHover()}
						>
							<Icon className="plus" />
							<div className="name">{translate('menuDataviewViewListAddView')}</div>
						</div>
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		const items = this.getItems();

		this._isMounted = true;
		this.rebind();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (items[i] || {}).id,
		});

		this.resize();
	};

	componentDidUpdate () {
		this.resize();

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};

		this.props.setActive(null, true);
	};

	componentWillUnmount () {
		this._isMounted = false;
		S.Menu.closeAll([ 'select' ]);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const items: any[] = U.Common.objectCopy(S.Record.getViews(rootId, blockId)).map(it => ({ 
			...it, name: it.name || translate('defaultNamePage'),
		}));

		items.unshift({ id: 'label', name: translate('menuDataviewViewListViews'), isSection: true });
		return items;
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onAdd () {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, getSources, isInline, getTarget, onViewSwitch } = data;
		const view = getView();
		const sources = getSources();
		const filters: I.Filter[] = [];
		const object = getTarget();

		const newView = {
			name: Dataview.defaultViewName(I.ViewType.Grid),
			type: I.ViewType.Grid,
			groupRelationKey: Relation.getGroupOption(rootId, blockId, view.type, '')?.id,
			cardSize: I.CardSize.Medium,
			filters,
			sorts: [],
		};

		C.BlockDataviewViewCreate(rootId, blockId, newView, sources, (message: any) => {
			if (message.error.code) {
				return;
			};

			const view = S.Record.getView(rootId, blockId, message.viewId);

			close();
			window.setTimeout(() => onViewSwitch(view), S.Menu.getTimeout());

			analytics.event('AddView', {
				type: view.type,
				objectType: object.type,
				embedType: analytics.embedType(isInline),
			});
		});
	};

	onViewContext (e: any, view: any) {
		e.stopPropagation();

		const { param, getId, getSize, close } = this.props;
		const { data } = param;
		const { rootId, blockId, onViewCopy, onViewRemove } = data;
		const element = `#${getId()} #item-${view.id}`;

		const contextParam = {
			rootId,
			blockId,
			view,
			onCopy: onViewCopy,
			onRemove: onViewRemove,
			close,
			menuParam: {
				element,
				offsetX: getSize().width,
				vertical: I.MenuDirection.Center,
			}
		};

		U.Menu.viewContextMenu(contextParam);
	};

	onClick (e: any, item: any) {
		const { close, param } = this.props;
		const { data } = param;
		const { rootId, blockId, isInline, getTarget } = data;
		const subId = S.Record.getSubId(rootId, blockId);
		const object = getTarget();

		S.Record.metaSet(subId, '', { viewId: item.id });
		C.BlockDataviewViewSetActive(rootId, blockId, item.id);

		analytics.event('SwitchView', {
			type: item.type,
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});

		close();
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const views = S.Record.getViews(rootId, blockId);
		const view = views[oldIndex];
		const ids = arrayMove(views.map(it => it.id), oldIndex, newIndex);

		if (!view) {
			return;
		};

		S.Record.viewsSort(rootId, blockId, ids);
		C.BlockDataviewViewSetPosition(rootId, blockId, view.id, newIndex);
		keyboard.disableSelection(false);
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = this.isAllowed() ? 58 : 16;
		const height = Math.max(HEIGHT + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height });
		position();
	};

	isAllowed () {	
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, readonly } = data;

		return !readonly && S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
	};

});

export default MenuViewList;