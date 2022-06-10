import * as React from 'react';
import { Icon } from 'ts/component';
import { I, C, translate } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore } from 'ts/store';

import Card from './card';
import Cell from 'ts/component/block/dataview/cell';

interface Props extends I.ViewComponent {
	id: string;
	value: any;
	onAdd (groupId: string): void;
	onDragStartColumn?: (e: any, groupId: any) => void;
	onDragStartCard?: (e: any, groupId: any, record: any) => void;
};

const Column = observer(class Column extends React.Component<Props, {}> {

	render () {
		const { rootId, block, id, getView, onAdd, value, onDragStartColumn } = this.props;
		const view = getView();
		const subId = dbStore.getSubId(rootId, [ block.id, id ].join(':'));
		const records = dbStore.getRecords(subId, '');
		const { offset, total } = dbStore.getMeta(subId, '');
		const head = {};

		head[view.groupRelationKey] = value;

		const Add = (item: any) => (
			<div 
				className="card add"
				onClick={() => { onAdd(id); }}
			>
				<Icon className="plus" />
			</div>
		);

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
					{records.map((record: any, i: number) => (
						<Card key={'board-card-' +  view.id + i} {...this.props} id={record.id} groupId={id} />
					))}
					<Add />
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.load();
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
		];

		switch (relation.format) {
			default:
				filters.push({ operator: I.FilterOperator.And, relationKey: relation.relationKey, condition: I.FilterCondition.Equal, value: value });
				break;
		};

		C.ObjectSearchSubscribe(subId, filters, view.sorts, getKeys(view.id), block.content.sources, 0, 100, true, '', '', false);
	};

	clear () {
		const { rootId, block, id } = this.props;
		const subId = dbStore.getSubId(rootId, [ block.id, id ].join(':'));

		dbStore.recordsClear(subId, '');
	};

});

export default Column;