import * as React from 'react';
import { InputWithFile, Loader, IconObject, Error, ObjectName, Icon } from 'Component';
import { I, S, U, focus, translate, Action, analytics } from 'Lib';
import { observer } from 'mobx-react';

const BlockFile = observer(class BlockFile extends React.Component<I.BlockComponent> {

	_isMounted = false;

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { id, content } = block;
		const { state, style, targetObjectId } = content;
		const object = S.Detail.get(rootId, targetObjectId, []);

		let element = null;
		if (object.isDeleted) {
			element = (
				<div className="deleted">
					<Icon className="ghost" />
					<div className="name">{translate('commonDeletedObject')}</div>
				</div>
			);
		} else {
			switch (state) {
				default:
				case I.FileState.Error:
				case I.FileState.Empty: {
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
				};
					
				case I.FileState.Uploading: {
					element = <Loader />;
					break;
				};
					
				case I.FileState.Done: {
					element = (
						<div 
							className="inner" 
							onMouseDown={this.onClick} 
						>
							<IconObject object={object} size={24} />
							<ObjectName object={object} />
							<span className="size">{U.File.size(object.sizeInBytes)}</span>
						</div>
					);
					break;
				};
			};
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
	
	onClick (e: any) {
		if (!e.button) {
			Action.openFile(this.props.block.getTargetObjectId(), analytics.route.block);
		};
	};

});

export default BlockFile;