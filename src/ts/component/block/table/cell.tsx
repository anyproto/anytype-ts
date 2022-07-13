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
			onCellLeave, onCellKeyDown, onCellKeyUp, onResizeStart, onDragStartColumn, onDragStartRow, onEnterHandle, onLeaveHandle, onCellUpdate
		} = this.props;

		if (!row || !column) {
			return null;
		};

		const cn = [ 'cell', 'column' + column.id ];
		const cellId = [ row.id, column.id ].join('-');
		const inner = <div className="inner" />;

		if (block) {
			cn.push('align-v' + block.vAlign);
		};

		const Handle = (item: any) => {
			let onDragStart: any = () => {};
			let onClick: any = () => {};
			let cn = [ 'handle' ];
			let canDrag = true;

			switch (item.type) {
				case I.BlockType.TableColumn:
					cn.push('handleColumn canDrag');

					onDragStart = (e: any) => { onDragStartColumn(e, column.id); };
					onClick = (e: any) => { onHandleColumn(e, item.type, row.id, column.id, cellId); }
					break;

				case I.BlockType.TableRow:
					cn.push('handleRow');
					canDrag = !row.content.isHeader;

					if (canDrag) {
						onDragStart = (e: any) => { onDragStartRow(e, row.id); };
					};
					onClick = (e: any) => { onHandleRow(e, item.type, row.id, column.id, cellId); };
					break;
			};

			if (canDrag) {
				cn.push('canDrag');
			};

			return (
				<div 
					className={cn.join(' ')}
					draggable={canDrag}
					onMouseEnter={(e: any) => { onEnterHandle(e, item.type, row.id, column.id); }}
					onMouseLeave={(e: any) => { onLeaveHandle(e); }}
					onClick={onClick}
					onDragStart={onDragStart}
					onContextMenu={onClick}
				>
					<div className="inner" />
				</div>
			);
		};

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
				onClick={(e: any) => { onCellClick(e, row.id, column.id, cellId); }}
				onMouseEnter={(e: any) => { onCellEnter(e, row.id, column.id, cellId); }}
				onMouseLeave={(e: any) => { onCellLeave(e, row.id, column.id, cellId); }}
				onContextMenu={(e: any) => { onOptions(e, I.BlockType.Text, row.id, column.id, cellId); }}
				data-column-id={column.id}
			>
				{!rowIdx ? <Handle type={I.BlockType.TableColumn} {...column} /> : ''}
				{!columnIdx ? <Handle type={I.BlockType.TableRow} {...row} /> : ''}

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
						onKeyUp={(e: any, text: string, marks: I.Mark[], range: I.TextRange, props: any) => { 
							onCellKeyUp(e, row.id, column.id, cellId, text, marks, range, props);
						}}
						onUpdate={() => { onCellUpdate(row.id, column.id, cellId); }}
						onFocus={(e: any) => { onCellFocus(e, row.id, column.id, cellId); }}
						onBlur={(e: any) => { onCellBlur(e, row.id, column.id, cellId); }}
						getWrapperWidth={() => { return Constant.size.editor; }} 
					/>
				) : (
					<EmptyBlock />
				)}

				<div className="resize" onMouseDown={(e: any) => { onResizeStart(e, column.id); }} />
				<Icon className="menu" inner={inner} onClick={(e: any) => { onOptions(e, I.BlockType.Text, row.id, column.id, cellId); }} />
			</div>
		);
	};

});

export default BlockTableCell;