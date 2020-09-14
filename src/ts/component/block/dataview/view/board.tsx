import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Icon } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';

import Cell from '../cell';

interface Props extends I.ViewComponent {};

interface Column {
	value: string;
	list: any[];
};

const getItemStyle = (snapshot: any, draggableStyle: any) => {
	return draggableStyle;
};

const GROUP = 'name';
const Constant = require('json/constant.json');
const $ = require('jquery');

@observer
class ViewBoard extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
	};

	render () {
		const { rootId, block, view, readOnly } = this.props;
		const group = view.relations.find((item: I.Relation) => { return item.id == GROUP; });
		const relations = view.relations.filter((it: any) => { return it.isVisible; });

		if (!group) {
			return null;
		};

		const data = blockStore.getDbData(block.id);
		const { offset, total } = blockStore.getDbMeta(block.id);
		const columns = this.getColumns();
		
		const Card = (item: any) => {
			return (
				<Draggable key={item.index} draggableId={item.column + '-' + item.index} index={item.index}>
					{(provided: any, snapshot: any) => (
						<div 
							className="card"
							ref={provided.innerRef}
							{...provided.draggableProps}
							{...provided.dragHandleProps}
							style={getItemStyle(snapshot, provided.draggableProps.style)}
						>
							{relations.map((relation: any, i: number) => (
								<Cell 
									key={'board-cell-' + relation.id} 
									id={item.index} 
									rootId={rootId}
									block={block}
									view={view} 
									relation={...relation} 
									data={item.data} 
									readOnly={readOnly} 
								/>
							))}
						</div>
					)}
				</Draggable>
			);
		};

		const Add = (item: any) => (
			<Draggable draggableId={item.column + '-add'} index={item.index}>
				{(provided: any, snapshot: any) => (
					<div 
						className="card add"
						ref={provided.innerRef}
						{...provided.draggableProps}
						{...provided.dragHandleProps}
						style={getItemStyle(snapshot, provided.draggableProps.style)}
						onClick={() => { this.onAdd(item.column); }}
					>
						<Icon className="plus" />
					</div>
				)}
			</Draggable>
		);

		const Head = (item: any) => {
			const head = {};
			head[GROUP] = item.value;
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

		const Column = (item: any) => {
			return (
				<Draggable draggableId={'column-' + item.index} index={item.index}>
					{(provided: any, snapshot: any) => (
						<div 
							className="column"
							ref={provided.innerRef}
							{...provided.draggableProps}
							{...provided.dragHandleProps}
							style={getItemStyle(snapshot, provided.draggableProps.style)}
						>
							<Head value={item.value} />
							<Droppable droppableId={'column-' + item.index + '-drop'} direction="vertical" type="row">
								{(provided: any) => (
									<div className="list" {...provided.droppableProps} ref={provided.innerRef}>
										{item.list.map((child: any, i: number) => (
											<Card key={'board-card-' + i} column={item.index} index={i} data={...child} />
										))}
										<Add column={item.index} index={item.list.length + 1} />
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</div>
					)}
				</Draggable>
			);
		};

		return (
			<div className="wrap">
				<div className="scroll">
					<div className="viewItem viewBoard">
						<DragDropContext onDragStart={this.onDragStart} onDragEnd={this.onDragEnd}>
							<Droppable droppableId="columns" direction="horizontal" type="column">
								{(provided: any) => (
									<div className="columns" {...provided.droppableProps} ref={provided.innerRef}>
										{columns.map((item: any, i: number) => (
											<Column key={i} index={i} {...item} />
										))}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</DragDropContext>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	onAdd (column: number) {
	};

	onDragStart () {
	};

	onDragEnd () {
	};

	resize () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');
		const viewItem = node.find('.viewItem');
		const columns = this.getColumns();
		const ww = win.width();
		const mw = ww - 192;
		const size = Constant.size.dataview.board;
		
		let vw = 0;
		let margin = 0;
		let width = columns.length * (size.card + size.margin);

		if (width < mw) {
			vw = mw;
		} else {
			vw = width;
			margin = (ww - mw) / 2; 
		};

		scroll.css({ width: ww, marginLeft: -margin, paddingLeft: margin });
		viewItem.css({ width: vw });
	};
	
	getColumns (): Column[] {
		const { block } = this.props;
		const data = Util.objectCopy(blockStore.getDbData(block.id));

		let r: Column[] = [];
		
		for (let i in data) {
			let item = data[i];
			let col = r.find((col) => { return col.value == item[GROUP]; });
			
			item.index = i;
			
			if (!col) {
				col = { value: item[GROUP], list: [] }
				r.push(col);
			};
			col.list.push(item);
		};
		return r;
	};
	
};

export default ViewBoard;