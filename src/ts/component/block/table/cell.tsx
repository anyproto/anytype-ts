import * as React from 'react';
import { I } from 'ts/lib';
import { Icon, Block } from 'ts/component';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';
import { SortableHandle } from 'react-sortable-hoc';

interface Props extends I.BlockComponentTable {
	rowIdx: number;
	columnIdx: number;
};

const Constant = require('json/constant.json');

const BlockTableCell = observer(class BlockTableCell extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

	};

	render () {
		const { rootId, block, readonly, isHead, rowIdx, columnIdx, getData, onOptions, onCellFocus, onCellBlur, onClick, onSort, onResizeStart } = this.props;
		const { rows, columns } = getData();
		const row = rows[rowIdx];
		const column = columns[columnIdx];
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const inner = blockStore.getLeaf(rootId, childrenIds[0]);

		if (!inner) {
			return null;
		};

		const cn = [ 'cell', 'column' + block.id, /* 'align-v' + block.vertical, 'align-h' + block.horizontal */ ];
		const acn = [ 'arrow' ];
		const css: any = {};
		const length = childrenIds.length;
		const bgColor = block.bgColor || column.bgColor || row.bgColor;

		const HandleColumn = SortableHandle((item: any) => (
			<div 
				className={[ 'icon', 'handleColumn' ].join(' ')}
				onClick={(e: any) => { onOptions(e, item.id); }}
				onContextMenu={(e: any) => { onOptions(e, item.id); }}
			/>
		));

		const HandleRow = SortableHandle((item: any) => (
			<div 
				className={[ 'icon', 'handleRow' ].join(' ')}
				onClick={(e: any) => { onOptions(e, item.id); }}
				onContextMenu={(e: any) => { onOptions(e, item.id); }}
			/>
		));

		const arrow = (
			<Icon 
				className={acn.join(' ')} 
				onClick={(e: any) => { onSort(e, column.id, nextSort); }}
			/>
		);

		let nextSort: I.SortType = I.SortType.Asc;

		/*
		if (sortIndex == item.id) {
			acn.push('c' + sortType);
			acn.push('show');
			nextSort = sortType == I.SortType.Asc ? I.SortType.Desc : I.SortType.Asc;
		} else {
			acn.push('c' + I.SortType.Asc);
		};
		*/

		if (isHead) {
			cn.push('isHead');
		};
		/*
		if (cell.color) {
			cn.push('textColor textColor-' + cell.color);
		};
		*/
		if (bgColor) {
			cn.push('bgColor bgColor-' + bgColor);
		};

		/*
		if (cell.width) {
			css.width = cell.width;
		};
		*/

		css.width = (1 / columns.length) * 100 + '%';

		return (
			<div
				id={`cell-${block.id}`}
				className={cn.join(' ')}
				style={css}
				onClick={(e: any) => { onClick(e, block.id); }}
				onContextMenu={(e: any) => { onOptions(e, block.id); }}
			>
				{isHead ? <HandleColumn {...column} /> : ''}
				{!columnIdx ? <HandleRow {...row} /> : ''}

				<Block 
					key={'table-' + inner.id} 
					{...this.props} 
					block={inner} 
					rootId={rootId} 
					readonly={readonly} 
					isInsideTable={true}
					className="noPlus"
					onFocus={(e: any) => { onCellFocus(e, block.id); }}
					onBlur={(e: any) => { onCellBlur(e, block.id); }}
					getWrapperWidth={() => { return Constant.size.editor; }} 
				/>

				{isHead ? arrow : ''}
				<div className="resize" onMouseDown={(e: any) => { onResizeStart(e, block.id); }} />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

});

export default BlockTableCell;