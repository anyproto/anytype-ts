import * as React from 'react';
import { I } from 'ts/lib';
import { Icon, Block } from 'ts/component';
import { observer } from 'mobx-react';

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
			rootId, block, readonly, rowIdx, columnIdx, row, column, onHandleRow, onHandleColumn, onOptions, onCellFocus, onCellBlur, onCellClick, onCellEnter, 
			onCellLeave, onCellKeyDown, onResizeStart, onDragStartColumn, onDragStartRow 
		} = this.props;

		if (!row || !column) {
			return null;
		};

		const cn = [ 'cell', 'column' + column.id ];
		const cellId = [ row.id, column.id ].join('-');
		const canDragRow = !row.content.isHeader;

		if (block) {
			cn.push('align-v' + block.vAlign);
		};

		const HandleColumn = (item: any) => (
			<div 
				className="icon handleColumn canDrag"
				draggable={true}
				onClick={(e: any) => { onHandleColumn(e, I.BlockType.TableColumn, row.id, column.id, cellId); }}
				onDragStart={(e: any) => { onDragStartColumn(e, column.id); }}
				onContextMenu={(e: any) => { onHandleColumn(e, I.BlockType.TableColumn, row.id, column.id, cellId); }}
			/>
		);

		const HandleRow = (item: any) => (
			<div 
				className={[ 'icon', 'handleRow', (canDragRow ? 'canDrag' : '') ].join(' ')}
				draggable={canDragRow}
				onClick={(e: any) => { onHandleRow(e, I.BlockType.TableRow, row.id, column.id, cellId); }}
				onDragStart={(e: any) => { canDragRow ? onDragStartRow(e, row.id) : null; }}
				onContextMenu={(e: any) => { onHandleRow(e, I.BlockType.TableRow, row.id, column.id, cellId); }}
			/>
		);

		const EmptyBlock = () => (
			<div className="block blockText noPlus align0">
				<div className="wrapContent">
					<div className="selectable">
						<div className="dropTarget">
							<div className="flex">
								<div className="markers" />
								<div
									id="value"
									className="value"
									contentEditable={true}
									suppressContentEditableWarning={true}
									onFocus={(e: any) => { onCellFocus(e, row.id, column.id, cellId); }}
									onBlur={(e: any) => { onCellBlur(e, row.id, column.id, cellId); }}
									onDragStart={(e: any) => { e.preventDefault(); }}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);

		return (
			<div
				id={`cell-${cellId}`}
				className={cn.join(' ')}
				onMouseDown={(e: any) => { onCellClick(e, row.id, column.id, cellId); }}
				onMouseEnter={(e: any) => { onCellEnter(e, row.id, column.id, cellId); }}
				onMouseLeave={(e: any) => { onCellLeave(e, row.id, column.id, cellId); }}
				onContextMenu={(e: any) => { onOptions(e, I.BlockType.Text, row.id, column.id, cellId); }}
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
						onKeyDown={(e: any, text: string, marks: I.Mark[], range: I.TextRange, props: any) => { 
							onCellKeyDown(e, row.id, column.id, cellId, text, marks, range, props);
						}}
						onFocus={(e: any) => { onCellFocus(e, row.id, column.id, cellId); }}
						onBlur={(e: any) => { onCellBlur(e, row.id, column.id, cellId); }}
						getWrapperWidth={() => { return Constant.size.editor; }} 
					/>
				) : (
					<EmptyBlock />
				)}

				<div className="resize" onMouseDown={(e: any) => { onResizeStart(e, column.id); }} />
				<Icon className="menu" onClick={(e: any) => { onOptions(e, I.BlockType.Text, row.id, column.id, cellId); }} />
			</div>
		);
	};

});

export default BlockTableCell;