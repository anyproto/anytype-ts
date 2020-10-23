import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { I, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore } from 'ts/store';
import Column from './board/column';

interface Props extends I.ViewComponent {};

const GROUP = 'isArchived';
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
		const group = view.relations.find((item: I.Relation) => { return item.key == GROUP; });
		const relations = view.relations.filter((it: any) => { return it.isVisible; });

		if (!group) {
			return null;
		};

		const data = dbStore.getData(block.id);
		const { offset, total } = dbStore.getMeta(block.id);
		const columns = this.getColumns();
		
		return (
			<div className="wrap">
				<div className="scroll">
					<div className="viewItem viewBoard">
						<DragDropContext onDragStart={this.onDragStart} onDragEnd={this.onDragEnd}>
							<Droppable droppableId="columns" direction="horizontal" type="column">
								{(provided: any) => (
									<div className="columns" {...provided.droppableProps} ref={provided.innerRef}>
										{columns.map((item: any, i: number) => (
											<Column key={i} {...this.props} {...item} data={data} idx={i} groupId={GROUP} onAdd={this.onAdd} />
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

	componentDidUpdate () {
		const win = $(window);
		win.trigger('resize.editor');
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
	
	getColumns (): any[] {
		const { block } = this.props;
		const data = Util.objectCopy(dbStore.getData(block.id));

		let columns: any[] = [];
		
		for (let i in data) {
			let item = data[i];
			let col = columns.find((col) => { return col.value == item[GROUP]; });
			
			item.index = i;
			
			if (!col) {
				col = { value: item[GROUP], list: [] }
				columns.push(col);
			};
			col.list.push(item);
		};

		return columns;
	};
	
};

export default ViewBoard;