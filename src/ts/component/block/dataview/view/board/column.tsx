import * as React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import Card from './card';
import Cell from 'ts/component/block/dataview/cell';

interface Props extends I.ViewComponent {
	groupId: string;
	value: string;
	index: number;
	list: any[];
	onAdd (column: number): void;
};

const getItemStyle = (snapshot: any, style: any) => {
	return style;
};

class Column extends React.Component<Props, {}> {

	render () {
		const { rootId, block, groupId, view, onAdd, list, index, value } = this.props;
		const group = view.relations.find((item: I.Relation) => { return item.id == groupId; });

		const Add = (item: any) => (
			<Draggable draggableId={index + '-add'} index={item.index}>
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
						view={view} 
						relation={group} 
						data={head} 
						readOnly={true} 
					/>
				</div>
			);
		};

		return (
			<Draggable draggableId={'column-' + index} index={index} type="column">
				{(provided: any, snapshot: any) => (
					<div 
						className="column"
						ref={provided.innerRef}
						{...provided.draggableProps}
						{...provided.dragHandleProps}
						style={getItemStyle(snapshot, provided.draggableProps.style)}
					>
						<Head />
						<Droppable droppableId={'column-' + index} direction="vertical" type="row">
							{(provided: any) => (
								<div className="list" {...provided.droppableProps} ref={provided.innerRef}>
									{list.map((child: any, i: number) => (
										<Card key={'board-card-' + i} {...this.props} data={...child} column={index} index={i} />
									))}
									<Add column={index} index={list.length} />
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