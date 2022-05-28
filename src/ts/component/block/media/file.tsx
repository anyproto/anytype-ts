import * as React from 'react';
import { InputWithFile, Loader, IconObject, Error } from 'ts/component';
import { I, Util, DataUtil, FileUtil, focus, translate, Action } from 'ts/lib';
import { detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {};

const BlockFile = observer(class BlockFile extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onOpen = this.onOpen.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { id, content } = block;
		const { state, style } = content;
		
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
					<div className="flex" onMouseDown={this.onOpen}>
						<IconObject object={{ ...object, layout: I.ObjectLayout.File }} size={24} />
						<span className="name">{name}</span>
						<span className="size">{FileUtil.size(sizeInBytes)}</span>
					</div>
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
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
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
		Action.upload(I.FileType.File, rootId, block.id, url, '');
	};
	
	onChangeFile (e: any, path: string) {
		const { rootId, block } = this.props;
		Action.upload(I.FileType.File, rootId, block.id, '', path);
	};
	
	onOpen (e: any) {
		const { block } = this.props;
		const { content } = block;
		const { hash } = content;
		
		DataUtil.objectOpenPopup({ id: hash, layout: I.ObjectLayout.File });
	};
	
});

export default BlockFile;