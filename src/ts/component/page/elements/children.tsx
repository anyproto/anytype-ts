import * as React from 'react';
import { Block } from 'Component';
import { blockStore } from 'Store';
import { observer } from 'mobx-react';
import { I } from 'Lib';

const Children = observer(class Children extends React.Component<I.BlockComponent> {
	
	render () {
		const { rootId } = this.props;
		const children = blockStore.getChildren(rootId, rootId, it => !it.isLayoutHeader());

		return (
			<React.Fragment>
				{children.map((block: I.Block, i: number) => (
					<Block key={`block-${block.id}`} {...this.props} block={block} index={i} />
				))}
			</React.Fragment>
		);
	};

});

export default Children;