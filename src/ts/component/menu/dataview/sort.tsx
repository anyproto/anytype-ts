import * as React from 'react';
import arrayMove from 'array-move';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, IconObject, Select } from 'Component';
import { I, C, Relation, UtilCommon, keyboard, analytics, translate } from 'Lib';
import { commonStore, menuStore, dbStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

const HEIGHT = 48;
const LIMIT = 20;

const MenuSort = observer(class MenuSort extends React.Component<I.Menu> {
	
	node: any = null;
	n = -1;
	top = 0;
	cache: any = {};
	refList: any = null;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { config } = commonStore;
		const { param, getId, setHover } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();
		
		if (!view) {
			return null;
		};

		const isReadonly = this.isReadonly();
		const items = this.getItems();
		const sortCnt = items.length;
		
		const typeOptions = [
			{ id: String(I.SortType.Asc), name: translate('commonAscending') },
			{ id: String(I.SortType.Desc), name: translate('commonDescending') },
		];
		
		const relationOptions = this.getRelationOptions();

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));
		
		const Item = SortableElement((item: any) => {
			const relation: any = dbStore.getRelationByKey(item.relationKey) || {};
			return (
				<div 
					id={'item-' + item.id} 
					className={[ 'item', (isReadonly ? 'isReadonly' : '') ].join(' ')}
					onMouseEnter={e => this.onOver(e, item)}
					style={item.style}
				>
					{!isReadonly ? <Handle /> : ''}
					<IconObject size={40} object={{ relationFormat: relation.format, layout: I.ObjectLayout.Relation }} />
					<div className="txt">
						<Select 
							id={[ 'filter', 'relation', item.id ].join('-')} 
							options={relationOptions} 
							value={item.relationKey} 
							onChange={v => this.onChange(item.id, 'relationKey', v)} 
							readonly={isReadonly}
						/>

						<Select 
							id={[ 'filter', 'type', item.id ].join('-')} 
							className="grey" 
							options={typeOptions} 
							value={item.type} 
							onChange={v => this.onChange(item.id, 'type', v)} 
							readonly={isReadonly}
						/>
					</div>
					{!isReadonly ? (
						<div className="buttons">
							<Icon className="more" onClick={e => this.onMore(e, item)} />
							<Icon className="delete" onClick={e => this.onRemove(e, item)} />
						</div>
					) : ''}
				</div>
			);
		});

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					<Item key={item.id} {...item} index={param.index} style={param.style} />
				</CellMeasurer>
			);
		};
		
		const List = SortableContainer(() => {
			return (
				<div className="items">
					{!items.length ? (
						<div className="item empty">
							<div className="inner">{translate('menuDataviewSortNoSortsApplied')}</div>
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
					lockAxis="y"
					lockToContainerEdges={true}
					transitionDuration={150}
					distance={10}
					onSortStart={this.onSortStart}
					onSortEnd={this.onSortEnd}
					useDragHandle={true}
					helperClass="isDragging"
					helperContainer={() => $(`#${getId()} .items`).get(0)}
				/>
				{!isReadonly ? (
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
							<div className="name">{translate('menuDataviewSortNewSort')}</div>
						</div> 
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount() {
		const items = this.getItems();

		this.rebind();
		this.resize();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (items[i] || {}).id,
		});
	};
	
	componentDidUpdate () {
		this.resize();

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};

		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();
		menuStore.closeAll(Constant.menuIds.cell);
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
		const { getView } = data;
		const view = getView();

		return view ? UtilCommon.objectCopy(view.sorts || []) : [];
	};

	getRelationOptions () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;

		return Relation.getFilterOptions(rootId, blockId, getView());
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param, getId } = this.props;
		const { data } = param;

		menuStore.open('select', {
			element: `#${getId()} #item-${item.id}`,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				...data,
				options: this.getRelationOptions(),
				value: item.relationKey,
				itemId: item.id,
				onSelect: (e: any, el: any) => {
					this.onChange(item.id, 'relationKey', el.id);
				}
			}
		});
	};

	onMore (e: any, item: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const options = [
			{ name: translate('menuDataviewSortShowEmpty'), isSection: true },
			{ id: I.EmptyType.Start, name: translate('menuDataviewSortShowEmptyTop') },
			{ id: I.EmptyType.End, name: translate('menuDataviewSortShowEmptyBottom') },
		];

		menuStore.open('select', {
			element: `#${getId()} #item-${item.id} .more`,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				...data,
				options,
				value: String(item.empty),
				itemId: item.id,
				onSelect: (e: any, el: any) => {
					this.onChange(item.id, 'empty', el.id);
				}
			}
		});
	};


	onAdd () {
		const { param, getId } = this.props;
		const { data } = param;
		const { rootId, getView, getTarget, blockId, isInline } = data;
		const view = getView();
		const object = getTarget();
		const relationOptions = this.getRelationOptions();

		if (!relationOptions.length) {
			return;
		};

		const obj = $(`#${getId()}`);
		const content = obj.find('.content');
		const newItem = { 
			relationKey: relationOptions[0].id, 
			type: I.SortType.Asc,
		};

		C.BlockDataviewSortAdd(rootId, blockId, view.id, newItem, () => {
			content.animate({ scrollTop: content.get(0).scrollHeight }, 50);
			
			analytics.event('AddSort', {
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});
	};

	onChange (id: number, k: string, v: string) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, isInline, getTarget } = data;
		const view = getView();
		const item = view.getSort(id);
		const object = getTarget();

		item[k] = v;

		C.BlockDataviewSortReplace(rootId, blockId, view.id, item.id, { ...item });

		analytics.event('ChangeSortValue', {
			type: item.type,
			objectType: object.type,
			embedType: analytics.embedType(isInline),
			emptyType: item.empty,
		});
		this.forceUpdate();
	};
	
	onRemove (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, getTarget, isInline } = data;
		const object = getTarget();
		const view = getView();

		C.BlockDataviewSortRemove(rootId, blockId, view.id, [ item.id ]);

		menuStore.close('select');
		analytics.event('RemoveSort', {
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex, } = result;
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, isInline, getTarget } = data;
		const view = getView();
		const object = getTarget();

		view.sorts = arrayMove(view.sorts, oldIndex, newIndex);
		C.BlockDataviewSortSort(rootId, blockId, view.id, view.sorts.map(it => it.id));

		keyboard.disableSelection(false);

		analytics.event('RepositionSort', {
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
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
		const offset = !this.isReadonly() ? 62 : 16;
		const height = Math.max(HEIGHT + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height });
		position();
	};

	isReadonly () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, readonly } = data;
		const allowedView = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		return readonly || !allowedView;
	};
	
});

export default MenuSort;