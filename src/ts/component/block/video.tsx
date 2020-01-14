import * as React from 'react';
import { InputWithFile, Icon, Loader, Error } from 'ts/component';
import { I, C } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockFile {
	rootId: string;
	commonStore?: any;
	blockStore?: any;
};

@inject('commonStore')
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
		const { commonStore, content } = this.props;
		const { state, hash } = content;
		const accept = [ 'mp4', 'm4v' ];
		
		console.log(content);
		
		let element = null;
		switch (state) {
			default:
			case I.FileState.Empty:
				element = (
					<InputWithFile icon="video" textFile="Upload a video" accept={accept} onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} />
				);
				break;
				
			case I.FileState.Uploading:
				element = (
					<Loader />
				);
				break;
				
			case I.FileState.Done:
				element = (
					<div className="wrap">
						<video controls={true} preload="auto" src={commonStore.fileUrl(hash)} />
						<Icon className="dots" />
					</div>
				);
				break;
				
			case I.FileState.Error:
				element = (
					<Error text="Error" />
				);
				break;
		};
		
		return (
			<React.Fragment>
				{element}
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