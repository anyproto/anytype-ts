import * as React from 'react';
import { I } from 'ts/lib';
import { Icon, Block } from 'ts/component';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';

interface Props extends I.BlockComponentTable {
	rowIdx: number;
	row: I.Block;
	columnIdx: number;
	column: I.Block;
};

const Constant = require('json/constant.json');

const BlockTableCell = observer(class BlockTableCell extends React.Component<Props, {}> {

	render () {
		const { 
			rootId, block, readonly, rowIdx, columnIdx, row, column, onOptions, onHandleClick, onCellFocus, onCellBlur, onCellClick, onCellEnter, 
			onCellLeave, onResizeStart, onDragStartColumn, onDragStartRow 
		} = this.props;

		if (!row || !column) {
			return null;
		};

		const cn = [ 'cell', 'column' + column.id ];
		const cellId = [ row.id, column.id ].join('-');

		if (block) {
			cn.push('align-v' + block.vAlign);
		};

		const HandleColumn = (item: any) => (
			<div 
				className="icon handleColumn"
				draggable={true}
				onClick={(e: any) => { onHandleClick(e, item.id); }}
				onDragStart={(e: any) => { onDragStartColumn(e, column.id); }}
				onContextMenu={(e: any) => { onHandleClick(e, item.id); }}
			/>
		);

		const HandleRow = (item: any) => (
			<div 
				className="icon handleRow"
				draggable={true}
				onClick={(e: any) => { onHandleClick(e, item.id); }}
				onDragStart={(e: any) => { onDragStartRow(e, row.id); }}
				onContextMenu={(e: any) => { onHandleClick(e, item.id); }}
			/>
		);

		return (
			<div
				id={`cell-${cellId}`}
				className={cn.join(' ')}
				onMouseDown={(e: any) => { onCellClick(e, cellId); }}
				onMouseEnter={(e: any) => { onCellEnter(e, rowIdx, columnIdx, cellId); }}
				onMouseLeave={(e: any) => { onCellLeave(e, rowIdx, columnIdx, cellId); }}
				onContextMenu={(e: any) => { onOptions(e, cellId); }}
				data-column-id={column.id}
			>
				{!rowIdx ? <HandleColumn {...column} /> : ''}
				{!columnIdx ? <HandleRow {...row} /> : ''}

				{block ? (
					<Block 
						key={`block-${cellId}`} 
						{...this.props} 
						block={block} 
						rootId={rootId} 
						readonly={readonly} 
						isInsideTable={true}
						className="noPlus"
						onFocus={(e: any) => { onCellFocus(e, block.id); }}
						onBlur={(e: any) => { onCellBlur(e, block.id); }}
						getWrapperWidth={() => { return Constant.size.editor; }} 
					/>
				) : (
					<div className="block noPlus">
						<div
							id="value"
							className="value"
							contentEditable={true}
							suppressContentEditableWarning={true}
							onFocus={(e: any) => { onCellFocus(e, cellId); }}
							onBlur={(e: any) => { onCellBlur(e, cellId); }}
							onDragStart={(e: any) => { e.preventDefault(); }}
						/>
					</div>
				)}

				<div className="resize" onMouseDown={(e: any) => { onResizeStart(e, column.id); }} />
				<Icon className="menu" onClick={(e: any) => { onOptions(e, cellId); }} />
			</div>
		);
	};

});

export default BlockTableCell;