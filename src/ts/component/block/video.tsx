import * as React from 'react';
import { InputWithFile } from 'ts/component';
import { I, C } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockText {
	rootId: string;
	blockStore?: any;
};

@inject('blockStore')
@observer
class BlockVideo extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { blockStore, id, rootId, content } = this.props;
		const accept = [ 'mp4' ];

		return (
			<React.Fragment>
				<InputWithFile icon="video" textFile="Upload a video" accept={accept} onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} />
			</React.Fragment>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onChangeUrl (e: any, url: string) {
		const { id, rootId } = this.props;
		
		C.BlockUpload(rootId, id, url, '');
	};
	
	onChangeFile (e: any, path: string) {
		const { id, rootId } = this.props;
		
		C.BlockUpload(rootId, id, '', path);
	};
	
};

export default BlockVideo;