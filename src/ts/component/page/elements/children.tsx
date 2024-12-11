import React, { forwardRef } from 'react';
import { Block } from 'Component';
import { observer } from 'mobx-react';
import { I, S } from 'Lib';

const Children = observer(forwardRef<{}, I.BlockComponent>((props, ref) => {

	const { rootId } = props;
	const childrenIds = S.Block.getChildrenIds(rootId, rootId);
	const children = S.Block.getChildren(rootId, rootId, it => !it.isLayoutHeader());
	const length = childrenIds.length;

	return (
		<>
			{children.map((block: I.Block, i: number) => (
				<Block key={`block-${block.id}`} {...props} block={block} index={i} className={i == 0 ? 'isFirst' : ''} />
			))}
		</>
	);

}));

export default Children;