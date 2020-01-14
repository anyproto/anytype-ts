import * as React from 'react';
import { InputWithFile, Loader, Icon } from 'ts/component';
import { I, C, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockFile {
	commonStore?: any;
	blockStore?: any;
	rootId: string;
};

const { ipcRenderer } = window.require('electron');

@inject('commonStore')
@inject('blockStore')
@observer
class BlockFile extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.onDownload = this.onDownload.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { id, rootId, content } = this.props;
		const { state, hash, size, name } = content;
		
		let element = null;
		switch (state) {
			default:
			case I.FileState.Empty:
				element = (
					<InputWithFile icon="file" textFile="Upload a file" onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} />
				);
				break;
				
			case I.FileState.Uploading:
				element = (
					<Loader />
				);
				break;
				
			case I.FileState.Done:
				element = (
					<React.Fragment>
						<span onMouseDown={this.onOpen}>
							<Icon className="type image" />
							<span className="name">{name}</span>
							<span className="size">{Util.fileSize(size)}</span>
						</span>
						<span className="download" onMouseDown={this.onDownload}>Download</span>
					</React.Fragment>
				);
				break;
				
			case I.FileState.Error:
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
	
	onOpen (e: any) {
		const { commonStore, content } = this.props;
		ipcRenderer.send('urlOpen', commonStore.fileUrl(content.hash));
	};
	
	onDownload (e: any) {
		const { commonStore, content } = this.props;
		ipcRenderer.send('download', commonStore.fileUrl(content.hash));
	};
	
};

export default BlockFile;