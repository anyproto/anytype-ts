import React, { forwardRef } from 'react';
import { Block } from 'Component';
import * as I from 'Interface';
import { virtualBlock } from 'Lib/virtualBlock';

const Children = forwardRef<{}, I.BlockComponent>((props, ref) => {

	const { rootId } = props;
	// A block materialized from the trailing virtual placeholder is still rendered
	// by the placeholder slot until the swap completes — skip it here to avoid
	// rendering it twice
	const holdId = virtualBlock.getHoldId(rootId);
	const childrenIds = S.Block.getChildrenIds(rootId, rootId);
	const children = S.Block.getChildren(rootId, rootId, it => !it.isLayoutHeader() && (it.id != holdId));
	const length = childrenIds.length;

	return (
		<>
			{children.map((block: I.Block, i: number) => (
				<Block key={`block-${block.id}`} {...props} block={block} index={i} className={i == 0 ? 'isFirst' : ''} />
			))}
		</>
	);

});

export default Children;
