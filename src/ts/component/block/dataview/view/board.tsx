import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore, detailStore } from 'ts/store';

import Column from './board/column';

interface Props extends I.ViewComponent {
	dataset?: any;
};

const GROUP = 'done';
const Constant = require('json/constant.json');
const $ = require('jquery');

const ViewBoard = observer(class ViewBoard extends React.Component<Props, {}> {

	cache: any = {};
	ox: number = 0;
	oy: number = 0;

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
								<Column 
									key={i} 
									{...this.props} 
									{...item} 
									columnId={i} 
									groupId={GROUP} 
									onAdd={this.onAdd} 
									onDragStart={this.onDragStart}
								/>
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

	onDragStart (e: any, columnId: any, record: any) {
		e.stopPropagation();

		const { dataset } = this.props;
		const { selection, preventCommonDrop } = dataset || {};
		const target = $(e.currentTarget);
		const clone = target.clone();
		const node = $(ReactDOM.findDOMNode(this));
		const offset = target.offset();
		const viewItem = node.find('.viewItem');
		const items = node.find('.card');
		const win = $(window);

		$(document).off('dragover').on('dragover', (e: any) => { e.preventDefault(); });

		target.addClass('isDragging');
		clone.addClass('isClone').css({ zIndex: 10000, position: 'fixed', left: -10000, top: -10000 });
		viewItem.append(clone);

		e.dataTransfer.setDragImage(clone.get(0), 0, 0);
		this.ox = offset.left;
		this.oy = offset.top;

		selection.preventSelect(true);
		preventCommonDrop(true);

		items.each((i: number, item: any) => {
			item = $(item);

			const id = item.data('id');
			if (!id || item.hasClass('isClone')) {
				return;
			};

			const p = item.offset();
			this.cache[id] = {
				x: p.left,
				y: p.top,
				width: item.outerWidth(),
				height: item.outerHeight(),
			};
		});


		this.unbind();
		win.on('drag.board', (e: any) => { this.onDragMove(e, columnId, record); });
		win.on('dragend.board', (e: any) => { this.onDragEnd(e); });
	};

	onDragMove (e: any, columnId: any, record: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const viewItem = node.find('.viewItem');
		const items = viewItem.find('.card');
		const clone = viewItem.find('.isClone');
		const width = clone.outerWidth();
		const height = clone.outerHeight();
		const x = e.pageX;
		const y = e.pageY;

		viewItem.find('.card.isOver').removeClass('isOver top bottom');

		for (let i = 0; i < items.length; ++i) {
			const item = $(items.get(i));
			const id = item.data('id');
			const rect = this.cache[id];

			if (id == record.id) {
				continue;
			};
			
			if (rect && this.cache[record.id] && Util.rectsCollide({ x, y, width, height }, rect)) {
				const isTop = y <= rect.y + rect.height / 2;
				const cn = isTop ? 'top' : 'bottom';

				item.addClass('isOver ' + cn);
				item.find('.ghost.' + cn).css({ height: this.cache[record.id].height });
				break;
			};
		};
	};

	onDragEnd (e: any) {
		e.preventDefault();

		const { dataset } = this.props;
		const { selection, preventCommonDrop } = dataset || {};
		const node = $(ReactDOM.findDOMNode(this));
		const viewItem = node.find('.viewItem');

		viewItem.find('.isClone').remove();
		viewItem.find('.isOver').removeClass('isOver top bottom');
		viewItem.find('.isDragging').removeClass('isDragging');

		selection.preventSelect(false);
		preventCommonDrop(false);
		this.unbind();		
	};

	unbind () {
		$(window).off('dragend.board drag.board');
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