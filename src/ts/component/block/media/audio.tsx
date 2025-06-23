import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { InputWithFile, Loader, Error, MediaAudio, Icon } from 'Component';
import { I, S, J, U, translate, focus, keyboard, Action } from 'Lib';

const BlockAudio = observer(class BlockAudio extends React.Component<I.BlockComponent> {

	_isMounted = false;
	node: any = null;
	refPlayer: any = null;

	constructor (props: I.BlockComponent) {
		super(props);

		this.onPlay = this.onPlay.bind(this);
		this.onPause = this.onPause.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { id, content } = block;
		const { state, targetObjectId } = content;
		const object = S.Detail.get(rootId, targetObjectId, [ 'name', 'isDeleted', 'fileExt' ], true);
		const { name } = object;
		
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
						<>
							{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
							<InputWithFile 
								block={block} 
								icon="audio" 
								textFile={translate('blockAudioUpload')} 
								accept={J.Constant.fileExtension.audio} 
								onChangeUrl={this.onChangeUrl} 
								onChangeFile={this.onChangeFile} 
								readonly={readonly} 
							/>
						</>
					);
					break;
				};
					
				case I.FileState.Uploading: {
					element = <Loader />;
					break;
				};
					
				case I.FileState.Done: {
					element = (
						<MediaAudio
							ref={node => this.refPlayer = node}
							playlist={this.getPlaylist()}
							onPlay={this.onPlay}
							onPause={this.onPause}
						/>
					);
					break;
				};
			};
		};
		
		return (
			<div
				ref={node => this.node = node}
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
		this.rebind();
	};

	componentDidUpdate () {
		this.rebind();
		this.refPlayer?.updatePlaylist(this.getPlaylist());
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};

		$(this.node).on('resize', () => {
			if (this.refPlayer) {
				this.refPlayer.resize();
			};
		});
	};

	unbind () {
		if (this._isMounted) {
			$(this.node).off('resize');
		};
	};

	getPlaylist () {
		const { rootId, block } = this.props;
		const { targetObjectId } = block.content;
		const object = S.Detail.get(rootId, targetObjectId, [ 'name', 'isDeleted', 'fileExt' ], true);

		return [ 
			{ name: U.File.name(object), src: S.Common.fileUrl(object.id) },
		];
	};

	onPlay () {
		if (this._isMounted) {
			$(this.node).addClass('isPlaying');
		};
	};

	onPause () {
		if (this._isMounted) {
			$(this.node).removeClass('isPlaying');
		};
	};

	onKeyDown (e: any) {
		const { onKeyDown } = this.props;

		let ret = false;

		keyboard.shortcut('space', e, (pressed: string) => {
			e.preventDefault();
			e.stopPropagation();

			this.refPlayer?.onPlay();
			ret = true;
		});

		if (ret) {
			return;
		};
		
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
		Action.upload(I.FileType.Audio, rootId, block.id, url, '');
	};
	
	onChangeFile (e: any, path: string) {
		const { rootId, block } = this.props;
		Action.upload(I.FileType.Audio, rootId, block.id, '', path);
	};

});

export default BlockAudio;