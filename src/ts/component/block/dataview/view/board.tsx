import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore } from 'ts/store';
import Column from './board/column';

interface Props extends I.ViewComponent {}

const GROUP = 'name';
const Constant = require('json/constant.json');
const $ = require('jquery');

const ViewBoard = observer(class ViewBoard extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
	};

	render () {
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
											<Column key={i} {...this.props} {...item} columnId={i} groupId={GROUP} onAdd={this.onAdd} />
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
		this.resize();
		$(window).trigger('resize.editor');
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
		const columns = node.find('.column');
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

		columns.css({  });
		scroll.css({ width: ww, marginLeft: -margin, paddingLeft: margin });
		viewItem.css({ width: vw });
	};
	
	getColumns (): any[] {
		const { rootId, block } = this.props;
		const data = dbStore.getData(rootId, block.id);

		let columns: any[] = [];
		for (let i in data) {
			let item = data[i];
			let value = item[GROUP] || '';
			let col = columns.find((col) => { return col.value == value; });
			
			item.index = i;

			if (!col) {
				col = { value: value, list: [] }
				columns.push(col);
			};
			col.list.push(item);
		};
		return columns;
	};
	
});

export default ViewBoard;