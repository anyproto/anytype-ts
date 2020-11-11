import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Pager, Cell } from 'ts/component';
import { I, C, DataUtil } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.ViewComponent {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class ViewGrid extends React.Component<Props, {}> {

	cellRefs: Map<string, any> = new Map();

	constructor (props: any) {
		super (props);

		this.onRowOver = this.onRowOver.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellAdd = this.onCellAdd.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
	};

	render () {
		const { rootId, block, onOpen, getData, getView, readOnly, onRowAdd } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		const data = dbStore.getData(block.id);
		const { offset, total } = dbStore.getMeta(block.id);

		const CellHead = (item: any) => {
			const { relation } = item;
			const id = DataUtil.cellId('head', relation.key, '');

			return (
				<th id={id} className={'head c-' + DataUtil.relationClass(relation.format)} style={{ width: relation.width }}>
					<div className="cellContent">
						<Icon className={'relation c-' + DataUtil.relationClass(relation.format)} />
						<div className="name">{relation.name}</div>
						<div className="resize" onMouseDown={(e: any) => { this.onResizeStart(e, relation.key); }}>
							<div className="line" />
						</div>
					</div>
				</th>
			);
		};
		
		const CellBody = (item: any) => {
			let { relation, index } = item;
			let id = DataUtil.cellId('cell', relation.key, index);
			let cn = [ 'cell', 'c-' + DataUtil.relationClass(relation.format), (!readOnly ? 'canEdit' : '') ];

			if (item.relation.key == 'name') {
				cn.push('isName');
			};

			return (
				<td id={id} className={cn.join(' ')} onClick={(e: any) => { this.onCellClick(e, item); }}>
					<Cell 
						ref={(ref: any) => { this.cellRefs.set(id, ref); }} 
						{...item} 
						rootId={rootId}
						block={block}
						id={index} 
						viewType={I.ViewType.Grid}
						readOnly={readOnly}
						onOpen={onOpen}
					/>
				</td>
			);
		};
		
		const RowHead = (item: any) => (
			<tr className="row">
				{relations.map((relation: any, i: number) => (
					<CellHead key={'grid-head-' + relation.key} relation={relation} />
				))}
				<th className="head last">
					{!readOnly ? <Icon id="cell-add" className="plus" onClick={this.onCellAdd} /> : ''}
				</th>
			</tr>
		);
		
		const RowBody = (item: any) => (
			<tr id={'row-' + item.index} onMouseOver={(e: any) => { this.onRowOver(item.index); }} className="row">
				{relations.map((relation: any, i: number) => (
					<CellBody key={'grid-cell-' + relation.key} index={item.index} relation={relation} data={data} />
				))}
				<td className="cell last">&nbsp;</td>
			</tr>
		);

		const pager = (
			<Pager 
				offset={offset} 
				limit={Constant.limit.dataview.records} 
				total={total} 
				onChange={(page: number) => { getData(view.id, (page - 1) * Constant.limit.dataview.records); }} 
			/>
		);
		
		return (
			<div className="wrap">
				<div className="scroll">
					<table className="viewItem viewGrid">
						<thead>
							<RowHead />
						</thead>
						<tbody>
							{data.map((item: any, i: number) => (
								<RowBody key={'grid-row-' + i} index={i} />
							))}
							{!readOnly ? (
								<tr>
									<td className="cell add" colSpan={view.relations.length + 1} onClick={onRowAdd}>
										<Icon className="plus" />
										<div className="name">New</div>
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>

				{total ? pager : ''}
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		this.bind();
	};

	componentDidUpdate () {
		const win = $(window);

		this.bind();
		this.resize();

		win.trigger('resize.editor');
	};

	componentWillUnmount () {
		this.unbind();
	};

	bind () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');

		scroll.unbind('.scroll').scroll(() => {
			win.trigger('resize.menu');
		});
	};

	unbind () {
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');

		scroll.unbind('.scroll');
	};

	resize () {
		const { getView } = this.props;
		const view = getView();
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');
		const viewItem = node.find('.viewItem');
		const ww = win.width();
		const mw = ww - 192;
		
		let vw = 0;
		let margin = 0;
		let width = 0;

		for (let relation of view.relations) {
			if (!relation.isVisible) {
				continue;
			};
			width += relation.width;
		};

		if (width < mw) {
			vw = mw;
		} else {
			vw = width;
			margin = (ww - mw) / 2; 
		};

		scroll.css({ width: ww, marginLeft: -margin, paddingLeft: margin });
		viewItem.css({ width: vw });
		
		this.resizeLast();
	};

	resizeLast () {
		const { getView } = this.props;
		const view = getView();
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const lastHead = node.find('.head.last');
		const lastCell = node.find('.cell.last');
		const ww = win.width();
		const mw = ww - 192;
		
		let width = 0;
		let lw = 48;

		for (let relation of view.relations) {
			if (!relation.isVisible) {
				continue;
			};
			width += relation.width;
		};

		if (width < mw) {
			lw = Math.max(48, mw - width);
		};

		lastHead.css({ width: lw });
		lastCell.css({ width: lw });
	};

	onResizeStart (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);

		$('body').addClass('colResize');
		win.unbind('mousemove.cell mouseup.cell');
		win.on('mousemove.cell', (e: any) => { this.onResizeMove(e, id); });
		win.on('mouseup.cell', (e: any) => { this.onResizeEnd(e, id); });
	};

	onResizeMove (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const { getView } = this.props;
		const view = getView();
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#' + DataUtil.cellId('head', id, ''));
		const offset = el.offset();
		const idx = view.relations.findIndex((it: I.ViewRelation) => { return it.key == id; });

		let width = e.pageX - offset.left;
		width = Math.max(Constant.size.dataview.cell.min, width); 
		width = Math.min(Constant.size.dataview.cell.max, width);
		
		view.relations[idx].width = width;
		el.css({ width: width });

		this.resizeLast();
	};

	onResizeEnd (e: any, id: string) {
		const { rootId, block, getView } = this.props;
		const view = getView();

		$(window).unbind('mousemove.cell mouseup.cell');
		$('body').removeClass('colResize');

		C.BlockDataviewViewUpdate(rootId, block.id, view.id, view);
	};

	onRowOver (id: number) {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('.row.active').removeClass('active');
		node.find('#row-' + id).addClass('active');
	};

	onCellAdd (e: any) {
		const { rootId, block, readOnly, getData, getView } = this.props;

		commonStore.menuOpen('dataviewRelationEdit', { 
			element: '#cell-add',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				readOnly: readOnly,
				rootId: rootId,
				blockId: block.id, 
				getData: getData,
				getView: getView,
			},
		});
	};

	onCellClick (e: any, item: any) {
		const { readOnly } = this.props;
		const { index, relation } = item;

		if (readOnly || relation.isReadOnly) {
			return;
		};

		const id = DataUtil.cellId('cell', relation.key, index);
		const ref = this.cellRefs.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};
	
};

export default ViewGrid;