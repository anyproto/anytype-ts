import * as React from 'react';
import { Block } from 'Component';
import { blockStore } from 'Store';
import { observer } from 'mobx-react';
import { I } from 'Lib';

const Children = observer(class Children extends React.Component<I.BlockComponent> {
	
	render () {
		const { rootId } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const children = blockStore.getChildren(rootId, rootId, it => !it.isLayoutHeader());
		const length = childrenIds.length;

		return (
			<React.Fragment>
				{children.map((block: I.Block, i: number) => (
					<Block key={`block-${block.id}`} {...this.props} block={block} index={i} className={i == 0 ? 'isFirst' : ''} />
				))}
			</React.Fragment>
		);
	};

});

export default Children;