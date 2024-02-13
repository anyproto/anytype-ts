import * as React from 'react';
import { InputWithFile, Loader, IconObject, Error } from 'Component';
import { I, UtilObject, UtilFile, focus, translate, Action } from 'Lib';
import { detailStore } from 'Store';
import { observer } from 'mobx-react';

const BlockFile = observer(class BlockFile extends React.Component<I.BlockComponent> {

	_isMounted = false;

	constructor (props: I.BlockComponent) {
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
		const { state, style, targetObjectId } = content;
		const object = detailStore.get(rootId, targetObjectId, []);

		let element = null;
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
							textFile={translate('blockFileUpload')} 
							onChangeUrl={this.onChangeUrl} 
							onChangeFile={this.onChangeFile} 
							readonly={readonly} 
						/>
					</React.Fragment>
				);
				break;
				
			case I.FileState.Uploading:
				element = <Loader />;
				break;
				
			case I.FileState.Done:
				element = (
					<div className="flex" onMouseDown={this.onOpen}>
						<IconObject object={{ ...object, layout: I.ObjectLayout.File }} size={24} />
						<span className="name">{UtilFile.name(object)}</span>
						<span className="size">{UtilFile.size(object.sizeInBytes)}</span>
					</div>
				);
				break;
		};

		return (
			<div 
				className={[ 'focusable', 'c' + id ].join(' ')} 
				tabIndex={0} 
				onKeyDown={this.onKeyDown} 
				onKeyUp={this.onKeyUp} 
				onFocus={this.onFocus}
			>
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
			onKeyUp(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};

	onFocus () {
		focus.set(this.props.block.id, { from: 0, to: 0 });
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
		if (!e.button) {
			UtilObject.openPopup({ id: this.props.block.content.targetObjectId, layout: I.ObjectLayout.File });
		};
	};
	
});

export default BlockFile;