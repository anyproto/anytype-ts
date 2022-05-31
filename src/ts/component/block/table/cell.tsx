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

	render () {
		const { rootId, block, readonly, rowIdx, columnIdx, getData, onOptions, onHandleClick, onCellFocus, onCellBlur, onCellClick, onResizeStart, onDragStartColumn } = this.props;
		const { rows, columns } = getData();
		const row = rows[rowIdx];
		const column = columns[columnIdx];
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const inner = blockStore.getLeaf(rootId, childrenIds[0]);

		if (!row || !column || !inner) {
			return null;
		};

		const cn = [ 'cell', 'column' + column.id, /* 'align-v' + block.vertical */ ];
		const length = childrenIds.length;

		const HandleColumn = (item: any) => (
			<div 
				className="icon handleColumn"
				draggable={true}
				onClick={(e: any) => { onHandleClick(e, item.id); }}
				onDragStart={(e: any) => { onDragStartColumn(e, column.id); }}
				onContextMenu={(e: any) => { onHandleClick(e, item.id); }}
			/>
		);

		const HandleRow = SortableHandle((item: any) => (
			<div 
				className="icon handleRow"
				onClick={(e: any) => { onHandleClick(e, item.id); }}
				onMouseDown={(e: any) => { e.stopPropagation(); }}
				onContextMenu={(e: any) => { onHandleClick(e, item.id); }}
			/>
		));

		return (
			<div
				id={`block-${block.id}`}
				className={cn.join(' ')}
				onMouseDown={(e: any) => { onCellClick(e, block.id); }}
				onContextMenu={(e: any) => { onOptions(e, block.id); }}
				data-column-id={column.id}
			>
				{!rowIdx ? <HandleColumn {...column} /> : ''}
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

				<div className="resize" onMouseDown={(e: any) => { onResizeStart(e, column.id); }} />
				<Icon className="menu" onClick={(e: any) => { onOptions(e, block.id); }} />
			</div>
		);
	};
	
});

export default BlockTableCell;