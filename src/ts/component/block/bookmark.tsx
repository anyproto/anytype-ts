import * as React from 'react';
import { Icon, InputWithFile } from 'ts/component';
import { I, keyBoard } from 'ts/lib';
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
		const { blockStore, header } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.header.id == header.id; });
		
		if (!block) {
			return <div />;
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