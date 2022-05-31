import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';

import Cell from './cell';

interface Props extends I.BlockComponentTable {};

const BlockTableRow = observer(class BlockTableRow extends React.Component<Props, {}> {

	render () {
		const { rootId, block, index, getData } = this.props;
		const { rows, columns } = getData();
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const children = blockStore.getChildren(rootId, block.id);
		const length = childrenIds.length;

		return (
			<div id={`block-${block.id}`} className="row">
				{columns.map((column: any, i: number) => {
					const child = children[i];
					return child ? (
						<Cell 
							key={'cell' + child.id} 
							{...this.props}
							block={child}
							index={i}
							rowIdx={index}
							row={rows[index]}
							columnIdx={i}
							column={columns[i]}
						/>
					) : null;
				})}
			</div>
		);
	};
	
});

export default BlockTableRow;