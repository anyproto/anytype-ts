import * as React from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import { Icon } from 'Component';
import { I, C, UtilCommon, keyboard, Relation, analytics, UtilObject, translate } from 'Lib';
import { menuStore, dbStore, blockStore } from 'Store';

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
		const { param, getId } = this.props;
		const { data } = param;
		const { loadData, rootId, blockId } = data;
		const items = this.getItems();
		const allowed = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => (
			<div 
				id={'item-' + item.id} 
				className="item" 
				onClick={(e: any) => { this.onClick(e, item); }}
				onMouseEnter={(e: any) => { this.onOver(e, item); }}
				style={item.style}
			>
				{allowed ? <Handle /> : ''}
				<div className="clickable" onClick={(e: any) => { loadData(item.id, 0); }}>
					<div className="name">{item.name}</div>
				</div>
				<div className="buttons">
					<Icon className="more" onClick={(e: any) => { this.onEdit(e, item); }} />
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
							onMouseEnter={() => { this.props.setHover({ id: 'add' }); }} 
							onMouseLeave={() => { this.props.setHover(); }}
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
		menuStore.closeAll([ 'dataviewViewEdit' ]);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const items: any[] = UtilCommon.objectCopy(dbStore.getViews(rootId, blockId)).map(it => ({ 
			...it, name: it.name || UtilObject.defaultName('Page'),
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
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, loadData, getSources, isInline, getTarget } = data;
		const view = getView();
		const sources = getSources();
		const relations = UtilCommon.objectCopy(view.relations);
		const filters: I.Filter[] = [];
		const allowed = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
		const object = getTarget();

		for (let relation of relations) {
			if (relation.isHidden || !relation.isVisible) {
				continue;
			};

			filters.push({
				relationKey: relation.relationKey,
				operator: I.FilterOperator.And,
				condition: I.FilterCondition.None,
				value: null,
			});
		};

		const newView = {
			name: '',
			type: I.ViewType.Grid,
			groupRelationKey: Relation.getGroupOption(rootId, blockId, '')?.id,
			filters,
			cardSize: I.CardSize.Medium,
		};

		C.BlockDataviewViewCreate(rootId, blockId, newView, sources, (message: any) => {
			if (message.error.code) {
				return;
			};

			const view = dbStore.getView(rootId, blockId, message.viewId);

			menuStore.open('dataviewViewEdit', {
				element: `#${getId()}`,
				offsetX: getSize().width,
				offsetY: -getSize().height,
				data: {
					...data,
					readonly: !allowed,
					view: observable.box(view),
					onSave: () => {
						loadData(view.id, 0);
					},
				},
			});

			analytics.event('AddView', {
				type: view.type,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});
	};

	onEdit (e: any, item: any) {
		e.stopPropagation();

		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const allowed = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		menuStore.open('dataviewViewEdit', { 
			element: `#${getId()}`,
			offsetX: getSize().width,
			offsetY: -getSize().height,
			data: {
				...data,
				readonly: !allowed,
				view: observable.box(item),
				onSave: () => { this.forceUpdate(); },
			}
		});
	};

	onClick (e: any, item: any) {
		const { close, param } = this.props;
		const { data } = param;
		const { rootId, blockId, isInline, getTarget } = data;
		const subId = dbStore.getSubId(rootId, blockId);
		const object = getTarget();

		dbStore.metaSet(subId, '', { viewId: item.id });

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
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const views = dbStore.getViews(rootId, blockId);
		const oldIndex = result.oldIndex - 1;
		const newIndex = result.newIndex - 1;
		const view = views[oldIndex];
		if (!view) {
			return;
		};

		const ids = arrayMove(views.map(it => it.id), oldIndex, newIndex);

		dbStore.viewsSort(rootId, blockId, ids);
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
		const offset = 58;
		const height = Math.max(HEIGHT + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height });
		position();
	};

});

export default MenuViewList;