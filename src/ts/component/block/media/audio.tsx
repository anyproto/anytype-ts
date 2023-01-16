import * as React from 'react';
import { observer } from 'mobx-react';
import { InputWithFile, Loader, Error } from 'Component';
import { I, translate, focus, Util, keyboard, Action } from 'Lib';
import { commonStore } from 'Store';
import Constant from 'json/constant.json';

import BlockAudioControls from './controls';

const BlockAudio = observer(class BlockAudio extends React.Component<I.BlockComponent> {

	refControls: any = null;

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { block, readonly } = this.props;
		const { id, content } = block;
		const { state, hash, name } = content;
		
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
							icon="audio" 
							textFile="Upload an audio" 
							accept={Constant.extension.audio} 
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
					<div className="wrap resizable audio">
						<audio id="audio" preload="auto" src={commonStore.fileUrl(hash)} />

						<BlockAudioControls ref={node => this.refControls = node} {...this.props} />
					</div>
				);
				break;
		};
		
		return (
			<div
				id={'blockAudio-' + block.id}
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

	onKeyDown (e: any) {
		const { onKeyDown } = this.props;

		let ret = false;

		keyboard.shortcut('space', e, (pressed: string) => {
			e.preventDefault();
			e.stopPropagation();

			this.refControls.onPlay();
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
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
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