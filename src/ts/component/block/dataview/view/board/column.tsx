import * as React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
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
}

const getItemStyle = (snapshot: any, style: any) => {
	return style;
};

const Column = observer(class Column extends React.Component<Props, {}> {

	render () {
		const { rootId, block, groupId, getView, onAdd, list, columnId, value } = this.props;
		const view = getView();
		const group = view.getRelation(groupId);
		const records = dbStore.getRecords(rootId, block.id);
		const { offset, total } = dbStore.getMeta(rootId, block.id);
		const subId = dbStore.getSubId(rootId, block.id);

		const Add = (item: any) => (
			<Draggable draggableId={columnId + '-add'} index={item.index}>
				{(provided: any, snapshot: any) => (
					<div 
						className="card add"
						ref={provided.innerRef}
						{...provided.draggableProps}
						{...provided.dragHandleProps}
						style={getItemStyle(snapshot, provided.draggableProps.style)}
						onClick={() => { onAdd(item.column); }}
					>
						<Icon className="plus" />
					</div>
				)}
			</Draggable>
		);

		const Head = (item: any) => {
			const head = {};
			head[groupId] = value;

			return (
				<div className="head">
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
			<Draggable draggableId={'column-' + columnId} index={columnId} type="column">
				{(provided: any, snapshot: any) => (
					<div 
						className="column"
						ref={provided.innerRef}
						{...provided.draggableProps}
						{...provided.dragHandleProps}
						style={getItemStyle(snapshot, provided.draggableProps.style)}
					>
						<Head index={columnId} />
						<Droppable droppableId={'column-' + columnId} direction="vertical" type="row">
							{(provided: any) => (
								<div className="list" {...provided.droppableProps} ref={provided.innerRef}>
									{list.map((child: any, i: number) => (
										<Card key={'board-card-' +  view.id + i} {...this.props} index={child.index} columnId={columnId} idx={i} />
									))}
									<Add column={columnId} index={list.length} />
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</div>
				)}
			</Draggable>
		);
	};

});

export default Column;