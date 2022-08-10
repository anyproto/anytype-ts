import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Loader } from 'Component';
import { I, C, Util, translate, keyboard, DataUtil } from 'Lib';
import { observer } from 'mobx-react';
import { dbStore, detailStore } from 'Store';

import Card from './card';
import Cell from 'Component/block/dataview/cell';

interface Props extends I.ViewComponent {
	id: string;
	value: any;
	onRecordAdd (groupId: string, dir: number): void;
	onDragStartColumn?: (e: any, groupId: string) => void;
	onScrollColumn?: () => void;
	onDragStartCard?: (e: any, groupId: string, record: any) => void;
	getSubId?: () => string;
	applyGroupOrder?: () => void;
};

interface State {
	loading: boolean;
};

const Constant = require('json/constant.json');

const Column = observer(class Column extends React.Component<Props, State> {

	cache: any = {};
	width: number = 0;
	columnWidth: number = 0;
	columnCount: number = 0;
	offset: number = 0;
	loading: boolean = false;
	state = {
		loading: false,
	};

	constructor(props: Props) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
	};

	render () {
		const { rootId, block, id, getSubId, getView, onRecordAdd, value, onDragStartColumn, isPopup } = this.props;
		const { loading } = this.state;
		const view = getView();
		const subId = getSubId();
		const records = dbStore.getRecords(subId, '');
		const items = this.getItems();
		const { offset, total } = dbStore.getMeta(subId, '');
		const relation = dbStore.getRelation(rootId, block.id, view.groupRelationKey);
		const head = {};

		const colors = DataUtil.menuGetBgColors();
		const color = colors[Util.rand(0, colors.length - 1)];
		const cnbg = 'bgColor ' + color.id;

		head[view.groupRelationKey] = value;

		records.forEach((it: any) => {
			const object = detailStore.get(subId, it.id, [ view.groupRelationKey ]);
		});

		let label: any = null;
		let showCell = true;

		switch (relation.format) {
			case I.RelationType.Checkbox:
				label = `${relation.name} is ${value ? 'checked' : 'unchecked'}`;
				break;
		};

		return (
			<div 
				id={'column-' + id} 
				className="column withColor" 
				data-id={id}
			>
				<div className="head">
					<div className="sides">
						<div 
							className="side left"
							draggable={true}
							onDragStart={(e: any) => { onDragStartColumn(e, id); }}
						>
							{showCell ? (
								<Cell 
									id={'board-head-' + id} 
									rootId={rootId}
									subId={subId}
									block={block}
									relationKey={view.groupRelationKey} 
									viewType={I.ViewType.Board}
									getRecord={() => { return head; }}
									readonly={true} 
									arrayLimit={2}
									placeholder={translate('placeholderCellCommon')}
								/>
							) : ''}
							{label}
						</div>

						<div className="side right">
							<Icon className="more" />
							<Icon className="add"  onClick={() => { onRecordAdd(id, -1); }} />
						</div>
					</div>

					<div className={cnbg} />
				</div>

				<div className="body" onScroll={this.onScroll}>
					<div className="bg">
						{loading ? <Loader / > : (
							<React.Fragment>
								{items.map((item: any, i: number) => {
									let content = null;
									let key = [ 'board', view.id, id, item.id ].join('-');

									if (item.isAdd) {
										content = (
											<div key={key}  id={`card-${id}-add`} className="card add" onClick={() => { onRecordAdd(id, 1); }}>
												<Icon className="plus" />
											</div>
										);
									} else {
										content = (
											<Card 
												key={key} 
												{...this.props} 
												id={item.id} 
												groupId={id}
												index={i}
											/>
										);
									};
									return content;
								})}
							</React.Fragment>
						)}
						<div className={cnbg} />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.load(true);
	};

	componentWillUnmount () {
		this.clear();
	};

	load (clear: boolean) {
		if (this.loading) {
			return;
		};

		const { rootId, block, getView, getKeys, getSubId, value, applyGroupOrder } = this.props;
		const view = getView();
		const relation = dbStore.getRelation(rootId, block.id, view.groupRelationKey);
		const subId = getSubId();
		const limit = Constant.limit.dataview.records + this.offset;

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

			case I.RelationType.Tag:
				filters.push({ operator: I.FilterOperator.And, relationKey: relation.relationKey, condition: I.FilterCondition.ExactIn, value: value });
				break;
		};

		if (clear) {
			this.clear();
			this.setState({ loading: true });
		};

		this.loading = true;

		C.ObjectSearchSubscribe(subId, filters, view.sorts, getKeys(view.id), block.content.sources, 0, limit, true, '', '', false, () => {
			applyGroupOrder();

			if (clear) {
				this.setState({ loading: false });
			};

			this.loading = false;
		});
	};

	clear () {
		const { getSubId } = this.props;
		dbStore.recordsClear(getSubId(), '');
	};

	getItems () {
		const { getSubId, id } = this.props;
		const subId = getSubId();
		const records = dbStore.getRecords(subId, '');
		const items = Util.objectCopy(records);

		return items.concat([
			{ id: `${id}-add`, isAdd: true }
		]);
	};

	onScroll (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('.body');
		const st = body.scrollTop();

		if (keyboard.isDragging) {
			this.props.onScrollColumn();
		};

		if (st >= body.get(0).scrollHeight - body.height() - 100) {
			this.offset += Constant.limit.dataview.records;
			this.load(false);
		};
	};

});

export default Column;