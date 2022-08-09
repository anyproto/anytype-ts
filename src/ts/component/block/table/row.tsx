import * as React from 'react';
import { I } from 'Lib';
import { observer } from 'mobx-react';
import { blockStore } from 'Store';

import Cell from './cell';

interface Props extends I.BlockComponentTable {
	onRowUpdate: (rowId: string) => void;
};

const BlockTableRow = observer(class BlockTableRow extends React.Component<Props, {}> {

	render () {
		const { rootId, block, index, getData } = this.props;
		const { columns } = getData();
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const children = blockStore.getChildren(rootId, block.id);
		const length = childrenIds.length;
		const cn = [ 'row' ];

		if (block.content.isHeader) {
			cn.push('isHeader');
		};

		return (
			<div id={`row-${block.id}`} className={cn.join(' ')}>
				{columns.map((column: any, i: number) => {
					const child = children.find(it => it.id == [ block.id, column.id ].join('-'));
					return (
						<Cell 
							key={`cell-${block.id}-${column.id}`} 
							{...this.props}
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
	};

	componentDidUpdate () {
		const { onRowUpdate, block } = this.props;

		if (onRowUpdate) {
			onRowUpdate(block.id);
		};
	};
	
});

export default BlockTableRow;