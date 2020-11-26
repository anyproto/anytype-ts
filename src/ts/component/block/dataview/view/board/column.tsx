import * as React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import Card from './card';
import Cell from 'ts/component/block/dataview/cell';

interface Props extends I.ViewComponent {
	groupId: string;
	value: string;
	idx: number;
	list: any[];
	data: any[];
	onAdd (column: number): void;
};

const getItemStyle = (snapshot: any, style: any) => {
	return style;
};

class Column extends React.Component<Props, {}> {

	render () {
		const { rootId, block, groupId, getView, onAdd, list, data, idx, value } = this.props;
		const view = getView();

		const group = view.relations.find((item: I.Relation) => { return item.key == groupId; });
		const Add = (item: any) => (
			<Draggable draggableId={idx + '-add'} index={item.index}>
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

		const Head = () => {
			const head = {};
			head[groupId] = value;

			return (
				<div className="head">
					<Cell 
						id="" 
						rootId={rootId}
						block={block}
						relation={group} 
						viewType={I.ViewType.Board}
						getRecord={() => { return head; }}
						readOnly={true} 
					/>
				</div>
			);
		};

		return (
			<Draggable draggableId={'column-' + idx} index={idx} type="column">
				{(provided: any, snapshot: any) => (
					<div 
						className="column"
						ref={provided.innerRef}
						{...provided.draggableProps}
						{...provided.dragHandleProps}
						style={getItemStyle(snapshot, provided.draggableProps.style)}
					>
						<Head />
						<Droppable droppableId={'column-' + idx} direction="vertical" type="row">
							{(provided: any) => (
								<div className="list" {...provided.droppableProps} ref={provided.innerRef}>
									{list.map((child: any, i: number) => (
										<Card key={'board-card-' + i} {...this.props} data={data} index={child.index} column={idx} idx={i} />
									))}
									<Add column={idx} index={list.length} />
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</div>
				)}
			</Draggable>
		);
	};

	shouldComponentUpdate (nextProps: Props) {
		return (nextProps.list === this.props.list) && (nextProps.value === this.props.value);
	};

};

export default Column;