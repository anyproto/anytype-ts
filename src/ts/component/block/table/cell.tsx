import * as React from 'react';
import { observer } from 'mobx-react';
import { I, keyboard, UtilCommon } from 'Lib';
import { Icon, Block } from 'Component';
const Constant = require('json/constant.json');

interface Props extends I.BlockComponentTable {
	rowIdx: number;
	row: I.Block;
	columnIdx: number;
	column: I.Block;
};

const BlockTableCell = observer(class BlockTableCell extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onMouseDown = this.onMouseDown.bind(this);
	};

	render () {
		const { 
			readonly, block, rowIdx, columnIdx, row, column, onHandleRow, onHandleColumn, onOptions, onCellFocus, onCellBlur, onCellClick, onCellEnter, 
			onCellLeave, onCellKeyDown, onCellKeyUp, onResizeStart, onDragStartColumn, onDragStartRow, onEnterHandle, onLeaveHandle, onCellUpdate
		} = this.props;

		if (!row || !column) {
			return null;
		};

		const { isHeader } = row.content;
		const cn = [ 'cell', 'column' + column.id ];
		const cellId = [ row.id, column.id ].join('-');
		const inner = <div className="inner" />;

		if (block) {
			cn.push('align-v' + block.vAlign);
		};

		const Handle = (item: any) => {
			const cn = [ 'handle' ];

			let onDragStart = null;
			let onClick = null;
			let canDrag = true;

			switch (item.type) {
				case I.BlockType.TableColumn:
					cn.push('handleColumn canDrag');

					onDragStart = e => onDragStartColumn(e, column.id);
					onClick = e => onHandleColumn(e, item.type, row.id, column.id, cellId);
					break;

				case I.BlockType.TableRow:
					cn.push('handleRow');
					canDrag = !isHeader;

					if (canDrag) {
						onDragStart = e => onDragStartRow(e, row.id);
					};
					onClick = e => onHandleRow(e, item.type, row.id, column.id, cellId);
					break;
			};

			if (canDrag) {
				cn.push('canDrag');
			};

			return (
				<div 
					className={cn.join(' ')}
					draggable={canDrag}
					onMouseEnter={e => onEnterHandle(e, item.type, row.id, column.id)}
					onMouseLeave={e => onLeaveHandle(e)}
					onClick={onClick}
					onDragStart={onDragStart}
					onContextMenu={onClick}
				>
					<div className="inner" />
				</div>
			);
		};

		const EmptyBlock = () => {
			const cn = [ 'block', 'blockText', 'noPlus', 'align0' ];
			const cv = [ 'value' ]; 

			if (readonly) {
				cn.push('isReadonly');
				cv.push('isReadonly');
			};

			return (
				<div className={cn.join(' ')}>
					<div className="wrapContent">
						<div className="selectionTarget">
							<div className="dropTarget">
								<div className="flex">
									<div className="markers" />
									<div className="editableWrap">
										<div
											id="value"
											className={cv.join(' ')}
											contentEditable={!readonly}
											suppressContentEditableWarning={true}
											onFocus={e => onCellFocus(e, row.id, column.id, cellId)}
											onBlur={e => onCellBlur(e, row.id, column.id, cellId)}
											onDragStart={e => e.preventDefault()}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		};

		return (
			<div
				id={`cell-${cellId}`}
				className={cn.join(' ')}
				onClick={e => onCellClick(e, row.id, column.id, cellId)}
				onMouseEnter={e => onCellEnter(e, row.id, column.id, cellId)}
				onMouseLeave={e => onCellLeave(e, row.id, column.id, cellId)}
				onMouseDown={this.onMouseDown}
				{...UtilCommon.dataProps({ 'column-id': column.id })}
			>
				{!rowIdx ? <Handle key={'handle-column-' + cellId} type={I.BlockType.TableColumn} {...column} /> : ''}
				{!columnIdx ? <Handle key={'handle-row-' + cellId} type={I.BlockType.TableRow} {...row} /> : ''}

				{block ? (
					<Block 
						key={`block-${cellId}`} 
						{...this.props} 
						block={block} 
						isInsideTable={true}
						className="noPlus"
						onKeyDown={(e: any, text: string, marks: I.Mark[], range: I.TextRange, props: any) => { 
							onCellKeyDown(e, row.id, column.id, cellId, text, marks, range, props);
						}}
						onKeyUp={(e: any, text: string, marks: I.Mark[], range: I.TextRange, props: any) => { 
							onCellKeyUp(e, row.id, column.id, cellId, text, marks, range, props);
						}}
						onUpdate={() => onCellUpdate(cellId)}
						onFocus={e => onCellFocus(e, row.id, column.id, cellId)}
						onBlur={e => onCellBlur(e, row.id, column.id, cellId)}
						getWrapperWidth={() => Constant.size.editor} 
					/>
				) : (
					<EmptyBlock />
				)}

				{!readonly ? <div className="resize" onMouseDown={e => onResizeStart(e, column.id)} /> : ''}
				<Icon className="menu" inner={inner} onClick={e => onOptions(e, I.BlockType.Text, row.id, column.id, cellId)} />
			</div>
		);
	};

	onMouseDown (e: any) {
		keyboard.disableSelection(true);
		$(window).off('mousedown.table-cell').on('mousedown.table-cell', () => keyboard.disableSelection(false));
	};

});

export default BlockTableCell;