import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore, detailStore } from 'ts/store';

import Column from './board/column';

interface Props extends I.ViewComponent {};

const GROUP = 'done';
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
						<div className="columns">
							{columns.map((item: any, i: number) => (
								<Column key={i} {...this.props} {...item} columnId={i} groupId={GROUP} onAdd={this.onAdd} />
							))}
						</div>
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
		const { dataset } = this.props;
		const { selection } = dataset || {};

		selection.preventSelect(true);
	};

	onDragEnd () {
		const { dataset } = this.props;
		const { selection } = dataset || {};

		selection.preventSelect(false);
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

		scroll.css({ width: ww, marginLeft: -margin, paddingLeft: margin });
		viewItem.css({ width: vw });
	};
	
	getColumns (): any[] {
		const { rootId, block } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);
		const records = dbStore.getRecords(subId, '');
		const columns: any[] = [];

		records.forEach((it: any, i: number) => {
			const object = detailStore.get(subId, it.id, [ GROUP ]);
			const value = object[GROUP] || '';

			let column = columns.find((col) => { return col.value == value; });
			if (!column) {
				column = { value: value, list: [] }
				columns.push(column);
			};

			column.list.push({ id: object.id, index: i });
		});

		return columns;
	};
	
});

export default ViewBoard;