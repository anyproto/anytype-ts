import * as React from 'react';
import { Icon, Loader } from 'ts/component';
import { I, C, translate } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore, detailStore } from 'ts/store';
import { AutoSizer, WindowScroller, Masonry, CellMeasurer, CellMeasurerCache, createMasonryCellPositioner } from 'react-virtualized';

import Card from './card';
import Cell from 'ts/component/block/dataview/cell';

interface Props extends I.ViewComponent {
	id: string;
	value: any;
	onAdd (groupId: string): void;
	onDragStartColumn?: (e: any, groupId: any) => void;
	onDragStartCard?: (e: any, groupId: any, record: any) => void;
};

interface State {
	loading: boolean;
};

const Column = observer(class Column extends React.Component<Props, State> {

	cache: any = {};
	cellPositioner: any = null;
	ref: any = null;
	width: number = 0;
	columnWidth: number = 0;
	columnCount: number = 0;
	state = {
		loading: false,
	};

	constructor(props: Props) {
		super(props);

		this.cache = new CellMeasurerCache({
			defaultHeight: 240,
			defaultWidth: 240,
			fixedWidth: true,
		});

		this.onResize = this.onResize.bind(this);
	};

	render () {
		const { rootId, block, id, getView, onAdd, value, onDragStartColumn, isPopup } = this.props;
		const { loading } = this.state;
		const view = getView();
		const subId = dbStore.getSubId(rootId, [ block.id, id ].join(':'));
		const records = dbStore.getRecords(subId, '');
		const { offset, total } = dbStore.getMeta(subId, '');
		const head = {};

		head[view.groupRelationKey] = value;

		records.forEach((it: any) => {
			const object = detailStore.get(subId, it.id, [ view.groupRelationKey ]);
		});

		return (
			<div 
				id={'column-' + id} 
				className="column" 
				data-id={id}
			>
				<div 
					className="head" 
					draggable={true}
					onDragStart={(e: any) => { onDragStartColumn(e, id); }}
				>
					<Cell 
						id={'board-head-' + id} 
						rootId={rootId}
						subId={subId}
						block={block}
						relationKey={view.groupRelationKey} 
						viewType={I.ViewType.Board}
						getRecord={() => { return head; }}
						readonly={true} 
						placeholder={translate('placeholderCellCommon')}
					/>
				</div>

				<div className="body">
					{loading ? <Loader / > : (
						<WindowScroller scrollElement={isPopup ? $('#popupPage #innerWrap').get(0) : window}>
							{({ height, isScrolling, registerChild, scrollTop }) => {
								return (
									<AutoSizer 
										disableHeight={true}
										onResize={this.onResize} 
										overscanByPixels={200}
									>
										{({ width }) => {
											this.initPositioner();

											return (
												<div ref={registerChild}>
													<Masonry
														ref={(ref: any) => { this.ref = ref; }}
														className={[ 'masonry', (!records.length ? 'isEmpty' : '') ].join(' ')}
														autoHeight={true}
														height={Number(height) || 0}
														width={Number(width) || 0}
														isScrolling={isScrolling}
														cellCount={records.length}
														cellMeasurerCache={this.cache}
														cellPositioner={this.cellPositioner}
														cellRenderer={({ key, index, parent, style }) => {
															if (records.length - 1 < index) {
																return null;
															};

															return (
																<CellMeasurer cache={this.cache} index={index} key={'gallery-card-measurer-' + view.id + index} parent={parent}>
																	<Card 
																		key={'board-card-' +  view.id + index} 
																		{...this.props} 
																		id={records[index].id} 
																		groupId={id} 
																	/>
																</CellMeasurer>
															);
														}}
														scrollTop={scrollTop}
													/>

													<div className={[ 'card', 'add', (!total ? 'first' : '') ].join(' ')} onClick={() => { onAdd(id); }}>
														<Icon className="plus" />
													</div>
												</div>
											);
										}}
									</AutoSizer>
								);
							}}
						</WindowScroller>
					)}
				</div>

			</div>
		);
	};

	componentDidMount () {
		this.load();
	};

	componentDidUpdate () {
		this.reset();
	};

	componentWillUnmount () {
		this.clear();
	};

	load () {
		const { rootId, block, getView, getKeys, value, id } = this.props;
		const view = getView();
		const relation = dbStore.getRelation(rootId, block.id, view.groupRelationKey);
		const subId = dbStore.getSubId(rootId, [ block.id, id ].join(':'));

		if (!relation) {
			return;
		};

		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
		];

		switch (relation.format) {
			default:
				filters.push({ operator: I.FilterOperator.And, relationKey: relation.relationKey, condition: I.FilterCondition.Equal, value: value });
				break;
		};

		this.setState({ loading: true });
		C.ObjectSearchSubscribe(subId, filters, view.sorts, getKeys(view.id), block.content.sources, 0, 100, true, '', '', false, () => {
			this.setState({ loading: false });
		});
	};

	clear () {
		const { rootId, block, id } = this.props;
		const subId = dbStore.getSubId(rootId, [ block.id, id ].join(':'));

		dbStore.recordsClear(subId, '');
	};

	reset () {
		if (!this.ref) {
			return;
		};

		this.cache.clearAll();
		this.resetPositioner();
		this.ref.clearCellPositions();
	};

	initPositioner () {
		if (!this.cellPositioner) {
			this.cellPositioner = createMasonryCellPositioner({
				cellMeasurerCache: this.cache,
				columnCount: 1,
				columnWidth: 240,
				spacer: 8,
			});
		};
	};

	resetPositioner () {
		this.cellPositioner.reset({
			columnCount: 1,
			columnWidth: 240,
			spacer: 8,
    	});
	};

	onResize ({ width }) {
		this.reset();
	};

});

export default Column;