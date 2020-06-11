import * as React from 'react';
import { InputWithFile, Loader, Icon, Error } from 'ts/component';
import { I, C, keyboard, Util } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	block: I.Block;
	onKeyDown?(e: any, text?: string, marks?: I.Mark[]): void;
	onKeyUp?(e: any, text?: string, marks?: I.Mark[]): void;
};

const { ipcRenderer } = window.require('electron');

@observer
class BlockFile extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onOpen = this.onOpen.bind(this);
		this.onDownload = this.onDownload.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { rootId, block } = this.props;
		const { id, content } = block;
		const { state, hash, size, name, mime } = content;
		
		let element = null;
		let cn = [ 'focusable', 'c' + id ];

		switch (state) {
			default:
			case I.FileState.Empty:
				element = (
					<InputWithFile block={block} icon="file" textFile="Upload a file" onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} />
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
							<Icon className={[ 'type', this.getIcon() ].join(' ')} />
							<span className="name">{name}</span>
							<span className="size">{Util.fileSize(size)}</span>
						</span>
						<span className="download" onMouseDown={this.onDownload}>Download</span>
					</React.Fragment>
				);
				break;
				
			case I.FileState.Error:
				element = (
					<Error text="Error" />
				);
				break;
		};
		
		return (
			<div className={cn.join(' ')} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}>
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
		this.props.onKeyDown(e, '', []);
	};
	
	onKeyUp (e: any) {
		this.props.onKeyUp(e, '', []);
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
		const icon = this.getIcon();
		
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
	
	getIcon (): string {
		const { block } = this.props;
		const { content } = block;
		
		let icon = '';
		let t: string[] = [];
		let name = String(content.name || '');
		let mime = String(content.mime || '');
		
		let a: string[] = name.split('.');
		let e = a[a.length - 1];
			
		if ([ 'm4v' ].indexOf(e) >= 0) {
			icon = 'video';
		};
			
		if ([ 'csv', 'json', 'txt', 'doc', 'docx' ].indexOf(e) >= 0) {
			icon = 'text';
		};
			
		if ([ 'zip', 'gzip', 'tar', 'gz', 'rar' ].indexOf(e) >= 0) {
			icon = 'archive';
		};
		
		if (icon) {
			return icon;
		};
		
		if (mime) {
			let a: string[] = mime.split(';');
			if (a.length) {
				t = a[0].split('/');
			};
		};
		
		if (t.length) {
			if ([ 'image', 'video', 'text', 'audio' ].indexOf(t[0]) >= 0) {
				icon = t[0];
			};
			
			if ([ 'pdf' ].indexOf(t[1]) >= 0) {
				icon = t[1];
			};
			
			if ([ 'zip', 'gzip', 'tar', 'gz', 'rar' ].indexOf(t[1]) >= 0) {
				icon = 'archive';
			};
			
			if ([ 'vnd.ms-powerpoint' ].indexOf(t[1]) >= 0) {
				icon = 'presentation';
			};
			
			if ([ 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' ].indexOf(t[1]) >= 0) {
				icon = 'table';
			};
		};
		
		return String(icon || 'other');
	};
	
};

export default BlockFile;