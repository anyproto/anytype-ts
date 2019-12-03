import * as React from 'react';
import { Icon, InputWithFile } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockText {
	blockStore?: any;
	rootId: string;
};

@inject('blockStore')
@observer
class BlockBookmark extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
	};

	render () {
		const { blockStore, id, rootId, content } = this.props;
		
		return (
			<React.Fragment>
				<InputWithFile icon="bookmark" withFile={false} />
			</React.Fragment>
		);
	};
	
};

export default BlockBookmark;