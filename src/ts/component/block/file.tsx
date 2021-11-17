import * as React from 'react';
import { InputWithFile, Loader, IconObject, Error } from 'ts/component';
import { I, C, Util, focus, translate } from 'ts/lib';
import { commonStore, detailStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {}

const { ipcRenderer } = window.require('electron');
const { app } = window.require('@electron/remote')
const path = window.require('path');
const userPath = app.getPath('userData');

const BlockFile = observer(class BlockFile extends React.Component<Props, {}> {

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
		const { rootId, block, readonly } = this.props;
		const { id, content } = block;
		const { state } = content;
		
		let object = detailStore.get(rootId, content.hash, [ 'sizeInBytes' ]);
		if (object._empty_) {
			object = Util.objectCopy(content);
			object.sizeInBytes = object.size;
		};

		let { name, sizeInBytes } = object;
		let element = null;
		let cn = [ 'focusable', 'c' + id ];

		switch (state) {
			default:
			case I.FileState.Error:
			case I.FileState.Empty:
				element = (
					<React.Fragment>
						{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
						<InputWithFile 
							block={block} 
							icon="file" 
							textFile="Upload a file" 
							onChangeUrl={this.onChangeUrl} 
							onChangeFile={this.onChangeFile} 
							readonly={readonly} 
						/>
					</React.Fragment>
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
							<IconObject object={{ ...object, layout: I.ObjectLayout.File }} size={24} />
							<span className="name">{name}</span>
							<span className="size">{Util.fileSize(sizeInBytes)}</span>
						</span>
						<span className="download" onClick={this.onDownload}>{translate('blockFileDownload')}</span>
					</React.Fragment>
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
		const { onKeyDown } = this.props;
		
		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 });
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 });
		};
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
			popupStore.open('preview', {
				data: {
					type: I.FileType.Image,
					url: commonStore.fileUrl(hash),
				}
			});
		} else {
			C.DownloadFile(hash, path.join(userPath, 'tmp'), (message: any) => {
				if (message.path) {
					ipcRenderer.send('pathOpen', message.path);
				};
			});
		};
	};
	
	onDownload (e: any) {
		const { block } = this.props;
		const { content } = block;
		
		ipcRenderer.send('download', commonStore.fileUrl(content.hash));
	};
	
});

export default BlockFile;