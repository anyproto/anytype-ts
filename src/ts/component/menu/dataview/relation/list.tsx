import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Switch } from 'Component';
import { I, C, Relation, keyboard, Dataview, translate } from 'Lib';
import { menuStore, dbStore, blockStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

const HEIGHT = 28;
const LIMIT = 20;

const MenuRelationList = observer(class MenuRelationList extends React.Component<I.Menu> {
	
	node: any = null;
	n = -1;
	top = 0;
	cache: any = {};
	refList: any = null;

	constructor (props: I.Menu) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSwitch = this.onSwitch.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param, getId } = this.props;
		const { data } = param;
		const { readonly, rootId, blockId } = data;
		const items = this.getItems();
		const allowedView = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		items.map((it: any) => {
			const { format, name } = it.relation;
		});

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => {
			const canHide = allowedView && (item.relationKey != 'name');
			const canEdit = !readonly && allowedView;
			const cn = [ 'item' ];
			
			if (item.relation.isHidden) {
				cn.push('isHidden');
			};
			if (!canEdit) {
				cn.push('isReadonly');
			};

			return (
				<div 
					id={'item-' + item.relationKey} 
					className={cn.join(' ')} 
					onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }}
					style={item.style}
				>
					{allowedView ? <Handle /> : ''}
					<span className="clickable" onClick={(e: any) => { this.onClick(e, item); }}>
						<Icon className={'relation ' + Relation.className(item.relation.format)} />
						<div className="name">{item.relation.name}</div>
					</span>
					{canHide ? (
						<Switch 
							value={item.isVisible} 
							onChange={(e: any, v: boolean) => { this.onSwitch(e, item, v); }} 
						/>
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
		
		const List = SortableContainer((item: any) => (
			<div className="items">
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
			</div>
		));
		
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

				{!readonly && allowedView ? (
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
							<div className="name">{translate('menuDataviewRelationListAddRelation')}</div>
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
		this.rebind();

		this.props.setActive(null, true);
		this.props.position();

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};
	};

	componentWillUnmount () {
		this.unbind();
		menuStore.closeAll(Constant.menuIds.cell);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDown (e: any) {
		let ret = false;
		let items = this.getItems();
		let item = items[this.n];

		keyboard.shortcut('space', e, (pressed: string) => {
			e.preventDefault();

			this.onSwitch(e, item, !item.isVisible);
			ret = true;
		});

		if (ret) {
			return;
		};

		this.props.onKeyDown(e);
	};

	onAdd (e: any) {
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();
		const relations = Dataview.viewGetRelations(rootId, blockId, view);

		const onAdd = () => {
			if (data.onAdd) {
				data.onAdd();
			};
		};

		menuStore.open('relationSuggest', { 
			element: `#${getId()} #item-add`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Top,
			offsetY: 36,
			noAnimation: true,
			noFlipY: true,
			data: {
				...data,
				menuIdEdit: 'dataviewRelationEdit',
				filter: '',
				ref: 'dataview',
				skipKeys: relations.map(it => it.relationKey),
				onAdd,
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					Dataview.relationAdd(rootId, blockId, relation.relationKey, relations.length, getView(), (message: any) => {
						onAdd();

						if (onChange) {
							onChange(message);
						};
					});
				},
			}
		});
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const { readonly } = data;
		const relation = dbStore.getRelationByKey(item.relationKey);

		if (!relation || readonly) {
			return;
		};
		
		menuStore.open('dataviewRelationEdit', { 
			element: `#${getId()} #item-${item.relationKey}`,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			data: {
				...data,
				relationId: relation.id,
			}
		});
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();
		const relations = view.relations.filter(it => {
			const relation = dbStore.getRelationByKey(it.relationKey);
			return !relation.isHidden || (relation.isHidden && (it.relationKey == 'name'));
		});

		view.relations = arrayMove(relations, oldIndex, newIndex);
		C.BlockDataviewViewRelationSort(rootId, blockId, view.id, view.relations.map(it => it.relationKey));

		keyboard.disableSelection(false);
	};

	onSwitch (e: any, item: any, v: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();

		C.BlockDataviewViewRelationReplace(rootId, blockId, view.id, item.relationKey, { ...item, isVisible: v });
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();

		return Dataview.viewGetRelations(rootId, blockId, view).map((it: any) => ({ 
			...it,
			id: it.relationKey,
			relation: dbStore.getRelationByKey(it.relationKey) || {},
		}));
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const height = Math.max(HEIGHT * 2, Math.min(360, items.length * HEIGHT + 58));

		obj.css({ height });
		position();
	};
	
});

export default MenuRelationList;