import * as React from 'react';
import { Icon, InputWithFile } from 'ts/component';
import { I, C } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.BlockText {
	rootId: string;
};

@observer
class BlockBookmark extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onChangeUrl = this.onChangeUrl.bind(this);
	};

	render () {
		const { id, rootId, content } = this.props;
		
		return (
			<React.Fragment>
				<InputWithFile icon="bookmark" withFile={false} onChangeUrl={this.onChangeUrl} />
			</React.Fragment>
		);
	};
	
	onChangeUrl (e: any, url: string) {
		const { id, rootId } = this.props;
		C.BlockBookmarkFetch(rootId, id, url);
	};
	
};

export default BlockBookmark;