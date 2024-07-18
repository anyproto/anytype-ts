import * as React from 'react';
import { Block } from 'Component';
import { observer } from 'mobx-react';
import { I, S } from 'Lib';

const Children = observer(class Children extends React.Component<I.BlockComponent> {
	
	render () {
		const { rootId } = this.props;
		const childrenIds = S.Block.getChildrenIds(rootId, rootId);
		const children = S.Block.getChildren(rootId, rootId, it => !it.isLayoutHeader());
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