import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore } from 'ts/store';

import Card from './card';
import Cell from 'ts/component/block/dataview/cell';

interface Props extends I.ViewComponent {
	groupId: string;
	value: string;
	columnId: number;
	list: any[];
	onAdd (column: number): void;
	onDragStartColumn?: (e: any, columnId: any) => void;
	onDragStartCard?: (e: any, columnId: any, record: any) => void;
};

const Column = observer(class Column extends React.Component<Props, {}> {

	render () {
		const { rootId, block, groupId, getView, onAdd, list, columnId, value, onDragStartColumn } = this.props;
		const view = getView();
		const subId = dbStore.getSubId(rootId, block.id);
		const group = view.getRelation(groupId);
		const records = dbStore.getRecords(subId, '');
		const { offset, total } = dbStore.getMeta(subId, '');

		const Add = (item: any) => (
			<div 
				className="card add"
				onClick={() => { onAdd(item.column); }}
			>
				<Icon className="plus" />
			</div>
		);

		const Head = (item: any) => {
			const head = {};
			head[groupId] = value;

			return (
				<div 
					className="head" 
					draggable={true}
					onDragStart={(e: any) => { onDragStartColumn(e, columnId); }}
				>
					<Cell 
						id={'board-head-' + item.index} 
						rootId={rootId}
						subId={subId}
						block={block}
						relationKey={groupId} 
						viewType={I.ViewType.Board}
						getRecord={() => { return head; }}
						readonly={true} 
					/>
				</div>
			);
		};

		return (
			<div 
				id={'column-' + columnId} 
				className="column" 
				data-id={columnId}
			>
				<div className="ghost left" />
				<div className="body">
					<Head index={columnId} />
					<div className="list">
						{list.map((child: any, i: number) => (
							<Card key={'board-card-' +  view.id + i} {...this.props} index={child.index} columnId={columnId} idx={i} />
						))}
						<Add column={columnId} index={list.length} />
					</div>
				</div>
				<div className="ghost right" />
			</div>
		);
	};

});

export default Column;