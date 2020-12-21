import * as React from 'react';
import { InputWithFile, Loader, IconObject, Error } from 'ts/component';
import { I, C, Util, focus, translate } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {};

const { ipcRenderer } = window.require('electron');

@observer
class BlockFile extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onOpen = this.onOpen.bind(this);
		this.onDownload = this.onDownload.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { rootId, block, readOnly } = this.props;
		const { id, content } = block;
		
		let details = blockStore.getDetails(rootId, content.hash);
		if (details._detailsEmpty_) {
			details = Util.objectCopy(content);
			details.type = '/file';
			details.sizeInBytes = details.size;
		};

		let element = null;
		let cn = [ 'focusable', 'c' + id ];

		switch (content.state) {
			default:
			case I.FileState.Empty:
				element = (
					<InputWithFile block={block} icon="file" textFile="Upload a file" onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} readOnly={readOnly} />
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
						<span className="cp" onMouseDown={this.onOpen}>
							<IconObject object={{ ...details }} size={24} />
							<span className="name">{details.name}</span>
							<span className="size">{Util.fileSize(details.sizeInBytes)}</span>
						</span>
						<span className="download" onMouseDown={this.onDownload}>{translate('blockFileDownload')}</span>
					</React.Fragment>
				);
				break;
				
			case I.FileState.Error:
				element = (
					<Error text={translate('commonError')} />
				);
				break;
		};

		return (
			<div className={cn.join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{element}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onKeyDown (e: any) {
		this.props.onKeyDown(e, '', [], { from: 0, to: 0 });
	};
	
	onKeyUp (e: any) {
		this.props.onKeyUp(e, '', [], { from: 0, to: 0 });
	};

	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};
	
	onChangeUrl (e: any, url: string) {
		const { rootId, block } = this.props;
		const { id } = block;
		
		C.BlockUpload(rootId, id, url, '');
	};
	
	onChangeFile (e: any, path: string) {
		const { rootId, block } = this.props;
		const { id } = block;
		
		C.BlockUpload(rootId, id, '', path);
	};
	
	onOpen (e: any) {
		const { block } = this.props;
		const { content } = block;
		const { hash } = content;
		const icon = Util.fileIcon(content);
		
		if (icon == 'image') {
			commonStore.popupOpen('preview', {
				data: {
					type: I.FileType.Image,
					url: commonStore.fileUrl(hash),
				}
			});
		} else {
			ipcRenderer.send('urlOpen', commonStore.fileUrl(hash));
		};
	};
	
	onDownload (e: any) {
		const { block } = this.props;
		const { content } = block;
		
		ipcRenderer.send('download', commonStore.fileUrl(content.hash));
	};
	
};

export default BlockFile;