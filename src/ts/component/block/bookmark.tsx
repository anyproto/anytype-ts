import * as React from 'react';
import { Icon, InputWithFile } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockText {
	blockStore?: any;
};

@inject('blockStore')
@observer
class BlockBookmark extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
	};

	render () {
		const { blockStore, id } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.id == id; });
		
		if (!block) {
			return null;
		};
		
		const { content } = block;
		
		return (
			<React.Fragment>
				<InputWithFile icon="bookmark" withFile={false} />
			</React.Fragment>
		);
	};
	
};

export default BlockBookmark;