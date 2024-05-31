import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List as VList } from 'react-virtualized';
import { Label } from 'Component';
import { blockStore, dbStore, detailStore } from 'Store';
import { I, keyboard, translate, Action } from 'Lib';
import { SortableContainer } from 'react-sortable-hoc';
import arrayMove from 'array-move';
import WidgetListItem from './item';

const Constant = require('json/constant.json');

interface Props extends I.WidgetComponent {
	rootId: string;
	subId: string;
	parent?: I.Block;
	getRecords: () => any[];
};

const LIMIT = 30;
const HEIGHT_COMPACT = 28;
const HEIGHT_LIST = 64;

const WidgetViewList = observer(class WidgetViewList extends React.Component<Props> {

	node = null;
	refList = null;
	cache: any = null;
	top = 0;

	constructor (props: Props) {
		super(props);
		
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};

	render (): React.ReactNode {
		const { parent, block, isPreview, subId } = this.props;
		const { total } = dbStore.getMeta(subId, '');
		const items = this.getItems();
		const length = items.length;
		const isCompact = this.isCompact();

		if (!this.cache) {
			return null;
		};

		let content = null;

		if (!length) {
			content = <Label className="empty" text={translate('widgetEmptyLabel')} />;
		} else
		if (isPreview) {
			const rowRenderer = ({ index, key, parent, style }) => (
				<CellMeasurer
					key={key}
					parent={parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={index}
					fixedWidth
				>
					<WidgetListItem 
						{...this.props}
						{...items[index]}
						subId={subId} 
						id={items[index].id}
						style={style} 
						index={index}
						isCompact={isCompact}
					/>
				</CellMeasurer>
			);

			const List = SortableContainer(() => (
				<div className="items">
					<InfiniteLoader
						rowCount={total}
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
										rowCount={length}
										rowHeight={({ index }) => this.getRowHeight(items[index], index, isCompact)}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={LIMIT}
										scrollToAlignment="center"
										onScroll={this.onScroll}
									/>
							)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				</div>
			));

			content = (
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
					helperContainer={() => $(`#widget-${parent.id} .items`).get(0)}
				/>
			);
		} else {
			content = (
				<React.Fragment>
					{items.map((item: any) => (
						<WidgetListItem 
							key={`widget-${block.id}-${item.id}`} 
							{...this.props} 
							{...item} 
							subId={subId} 
							id={item.id} 
							isCompact={isCompact}
						/>
					))}
				</React.Fragment>
			);
		};

		return (
			<div ref={ref => this.node = ref} className="body">
				{content}
			</div>
		);
	};

	componentDidMount (): void {
		this.initCache();
		this.forceUpdate();
	};

	componentDidUpdate (): void {
		if (this.refList) {
			this.refList.scrollToPosition(this.top);
		};

		this.initCache();
		this.resize();
	};

	initCache () {
		if (this.cache) {
			return;
		};

		const items = this.getItems();
		const isCompact = this.isCompact();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: i => this.getRowHeight(items[i], i, isCompact),
			keyMapper: i => items[i],
		});
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { block, getRecords } = this.props;
		const { targetBlockId } = block.content;

		keyboard.disableSelection(false);

		if ((oldIndex == newIndex) || (targetBlockId != Constant.widgetId.favorite)) {
			return;
		};

		const { root } = blockStore;
		const records = getRecords();
		const children = blockStore.getChildren(root, root, it => it.isLink());
		const ro = records[oldIndex];
		const rn = records[newIndex];
		const oidx = children.findIndex(it => it.content.targetBlockId == ro);
		const nidx = children.findIndex(it => it.content.targetBlockId == rn);
		const current = children[oidx];
		const target = children[nidx];
		const childrenIds = blockStore.getChildrenIds(root, root);
		const position = newIndex < oldIndex ? I.BlockPosition.Top : I.BlockPosition.Bottom;

		blockStore.updateStructure(root, root, arrayMove(childrenIds, oidx, nidx));
		Action.move(root, root, target.id, [ current.id ], position);
	};

	getItems () {
		const { block, addGroupLabels, isPreview, getRecords, subId } = this.props;
		const { targetBlockId } = block.content;
		const isRecent = [ Constant.widgetId.recentOpen, Constant.widgetId.recentEdit ].includes(targetBlockId);

		let items = getRecords().map(id => detailStore.get(subId, id, Constant.sidebarRelationKeys));

		if (isPreview && isRecent) {
			// add group labels
			items = addGroupLabels(items, targetBlockId);
		};

		return items;
	};

	resize () {
		const { parent, isPreview } = this.props;
		const length = this.getItems().length;

		raf(() => {
			const obj = $(`#widget-${parent.id}`);
			const node = $(this.node);
			const head = obj.find('.head');
			const viewSelect = obj.find('#viewSelect');
			const offset = isPreview ? 20 : 8;

			console.log(node, obj);


			let height = this.getTotalHeight() + offset;
			if (isPreview) {
				let maxHeight = $('#listWidget').height() - head.outerHeight(true);
				if (viewSelect.length) {
					maxHeight -= viewSelect.outerHeight(true);
				};

				height = Math.min(maxHeight, height);
			};

			const css: any = { height, paddingTop: '', paddingBottom: 8 };
			
			if (!length) {
				css.paddingTop = 20;
				css.paddingBottom = 22;
				css.height = 36 + css.paddingTop + css.paddingBottom;
			};

			console.log(css);

			node.css(css);
		});
	};

	getTotalHeight () {
		const items = this.getItems();
		const isCompact = this.isCompact();

		let height = 0;

		items.forEach((item, index) => {
			height += this.getRowHeight(item, index, isCompact);
		});

		return height;
	};

	getRowHeight (item: any, index: number, isCompact: boolean) {
		if (item && item.isSection) {
			return index ? HEIGHT_COMPACT + 12 : HEIGHT_COMPACT;
		};
		return isCompact ? HEIGHT_COMPACT : HEIGHT_LIST;
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	isCompact () {
		return this.props.parent.content.layout == I.WidgetLayout.Compact;
	};

});

export default WidgetViewList;