import React, { forwardRef, useEffect } from 'react';
import { I, S } from 'Lib';
import { observer } from 'mobx-react';
import Cell from './cell';

interface Props extends I.BlockComponentTable {
	onRowUpdate: (rowId: string) => void;
};

const BlockTableRow = observer(forwardRef<{}, Props>((props, ref) => {

	const { rootId, block, index, getData, onRowUpdate } = props;
	const { columns } = getData();
	const childrenIds = S.Block.getChildrenIds(rootId, block.id);
	const children = S.Block.getChildren(rootId, block.id);
	const length = childrenIds.length;
	const cn = [ 'row' ];

	if (block.content.isHeader) {
		cn.push('isHeader');
	};

	useEffect(() => {
		if (onRowUpdate) {
			onRowUpdate(block.id);
		};
	});

	return (
		<div id={`row-${block.id}`} className={cn.join(' ')}>
			{columns.map((column: any, i: number) => {
				const child = children.find(it => it.id == [ block.id, column.id ].join('-'));
				return (
					<Cell 
						key={`cell-${block.id}-${column.id}`} 
						{...props}
						block={child}
						index={i}
						rowIdx={index}
						row={block}
						columnIdx={i}
						column={columns[i]}
					/>
				);
			})}
		</div>
	);

}));

export default BlockTableRow;