import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore, detailStore } from 'ts/store';
import { throttle } from 'lodash';

import Column from './board/column';

interface Props extends I.ViewComponent {
	dataset?: any;
};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');

const GROUP = 'status';
const THROTTLE = 20;

const ViewBoard = observer(class ViewBoard extends React.Component<Props, {}> {

	cache: any = {};
	width: number = 0;
	height: number = 0;
	frame: number = 0;
	groups: any[] = [];
	format: I.RelationType = null;

	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onDragStartColumn = this.onDragStartColumn.bind(this);
		this.onDragStartCard = this.onDragStartCard.bind(this);
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
									columnId={(i + 1)} 
									groupId={GROUP} 
									onAdd={this.onAdd} 
									onDragStartColumn={this.onDragStartColumn}
									onDragStartCard={this.onDragStartCard}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.loadGroups();
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
		$(window).trigger('resize.editor');
	};

	loadGroups () {
		C.ObjectRelationSearchDistinct(GROUP, (message: any) => {
			this.format = message.format;
			this.groups = message.groups;

			this.forceUpdate();
		});
	};

	onAdd (column: number) {
	};

	onDragStartCommon (e: any, target: any) {
		e.stopPropagation();

		const { dataset } = this.props;
		const { selection, preventCommonDrop } = dataset || {};
		
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const viewItem = node.find('.viewItem');
		const clone = target.clone();

		this.width = clone.outerWidth();
		this.height = clone.outerHeight();

		$('body').addClass('grab');
		target.addClass('isDragging');
		clone.addClass('isClone').css({ zIndex: 10000, position: 'fixed', left: -10000, top: -10000 });
		viewItem.append(clone);

		$(document).off('dragover').on('dragover', (e: any) => { e.preventDefault(); });
		e.dataTransfer.setDragImage(clone.get(0), 0, 0);

		selection.preventSelect(true);
		preventCommonDrop(true);
		
		this.unbind();
		win.on('dragend.board', (e: any) => { this.onDragEnd(e); });
	};

	initCache (items: any) {
		this.cache = {};
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
	};

	onDragStartColumn (e: any, columnId: any) {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		this.onDragStartCommon(e, node.find('#column-' + columnId));
		this.initCache(node.find('.column'));

		win.on('drag.board', throttle((e: any) => { this.onDragMoveColumn(e, columnId); }, THROTTLE));
	};

	onDragMoveColumn (e: any, columnId: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const items = node.find('.column');

		let isLeft = false;
		let hoverId = '';

		for (let i = 0; i < items.length; ++i) {
			const item = $(items.get(i));
			const id = item.data('id');
			const rect = this.cache[id];

			if (id == columnId) {
				continue;
			};

			if (rect && this.cache[columnId] && Util.rectsCollide({ x: e.pageX, y: e.pageY, width: this.width, height: this.height }, rect)) {
				isLeft = e.pageX <= rect.x + rect.width / 2;
				hoverId = id;
				break;
			};
		};

		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			this.clear();

			if (hoverId) {
				node.find(`#column-${hoverId}`).addClass('isOver ' + (isLeft ? 'left' : 'right'));
			};
		});
	};

	onDragStartCard (e: any, columnId: any, record: any) {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		this.onDragStartCommon(e, $(e.currentTarget));
		this.initCache(node.find('.card'));

		win.on('drag.board', throttle((e: any) => { this.onDragMoveCard(e, columnId, record); }, THROTTLE));
	};

	onDragMoveCard (e: any, columnId: any, record: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const items = node.find('.card');

		this.clear();

		for (let i = 0; i < items.length; ++i) {
			const item = $(items.get(i));
			const id = item.data('id');
			const rect = this.cache[id];

			if (id == record.id) {
				continue;
			};

			if (rect && this.cache[record.id] && Util.rectsCollide({ x: e.pageX, y: e.pageY, width: this.width, height: this.height + 8 }, rect)) {
				const isTop = e.pageY <= rect.y + rect.height / 2;
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

		$('body').removeClass('grab');
		node.find('.isClone').remove();
		node.find('.isDragging').removeClass('isDragging');

		selection.preventSelect(false);
		preventCommonDrop(false);

		this.cache = {};
		this.clear();
		this.unbind();
	};

	clear () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.isOver').removeClass('isOver top bottom left right');
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