import * as React from 'react';
import { Icon, InputWithFile } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.BlockText {
	rootId: string;
};

@observer
class BlockBookmark extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
	};

	render () {
		const { id, rootId, content } = this.props;
		
		return (
			<React.Fragment>
				<InputWithFile icon="bookmark" withFile={false} />
			</React.Fragment>
		);
	};
	
};

export default BlockBookmark;