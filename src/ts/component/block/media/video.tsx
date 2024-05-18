import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { InputWithFile, Icon, Loader, Error, MediaVideo } from 'Component';
import { I, C, translate, focus, Action, keyboard } from 'Lib';
import { commonStore } from 'Store';
import Constant from 'json/constant.json';

const BlockVideo = observer(class BlockVideo extends React.Component<I.BlockComponent> {

	_isMounted = false;
	node: any = null;
	div = 0;
	speed = 1;

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResizeMove = this.onResizeMove.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.onResizeInit = this.onResizeInit.bind(this);
		this.onPlay = this.onPlay.bind(this);
		this.onPause = this.onPause.bind(this);
	};

	render () {
		const { block, readonly } = this.props;
		const { id, fields, content } = block;
		const { state, targetObjectId } = content;
		const { width } = fields;
		const css: any = {};

		if (width) {
			css.width = (width * 100) + '%';
		};

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
							icon="video" 
							textFile={translate('blockVideoUpload')} 
							accept={Constant.fileExtension.video} 
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
					<div className="wrap resizable" style={css}>
						<MediaVideo
							src={commonStore.fileUrl(targetObjectId)}
							onPlay={this.onPlay}
							onPause={this.onPause}
						/>
						<Icon className="resize" onMouseDown={e => this.onResizeStart(e, false)} />
					</div>
				);
				break;
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
		this.initVideo();
	};
	
	componentDidUpdate () {
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	initVideo () {
		const node = $(this.node);
		const video = node.find('video');

		if (!video.length) {
			return;
		};

		this.div = 16 / 9;
		this.onResizeInit();

		video.on('canplay', (e: any) => {
			const el = video.get(0);

			this.div = el.videoWidth / el.videoHeight;
			this.onResizeInit();
		});
	};
	
	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const node = $(this.node);
		node.on('resizeStart', (e: any, oe: any) => this.onResizeStart(oe, true));
		node.on('resizeMove', (e: any, oe: any) => this.onResizeMove(oe, true));
		node.on('resizeEnd', (e: any, oe: any) => this.onResizeEnd(oe, true));
		node.on('resizeInit', (e: any, oe: any) => this.onResizeInit());
	};
	
	unbind () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(this.node);
		const video = node.find('video');
		
		node.off('resizeInit resizeStart resizeMove resizeEnd');
		video.off('canplay');
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
		const { id } = block;
		
		Action.upload(I.FileType.Video, rootId, id, url, '');
	};
	
	onChangeFile (e: any, path: string) {
		const { rootId, block } = this.props;
		const { id } = block;
		
		Action.upload(I.FileType.Video, rootId, id, '', path);
	};

	onPlay () {
		$(this.node).addClass('isPlaying');
	};

	onPause () {
		$(this.node).removeClass('isPlaying');
	};

	onResizeInit () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(this.node);
		const wrap = node.find('.wrap');
		
		if (!wrap.length) {
			return;
		};
		
		wrap.css({ width: (this.getWidth(true, 0) * 100) + '%' });
	};

	onResizeStart (e: any, checkMax: boolean) {
		e.preventDefault();
		e.stopPropagation();
		
		if (!this._isMounted) {
			return;
		};
		
		const { dataset, block } = this.props;
		const { selection } = dataset || {};
		const win = $(window);
		
		focus.set(block.id, { from: 0, to: 0 });
		win.off('mousemove.media mouseup.media');
		
		if (selection) {
			selection.hide();
		};

		keyboard.setResize(true);
		keyboard.disableSelection(true);
		$(`#block-${block.id}`).addClass('isResizing');
		win.on('mousemove.media', e => this.onResizeMove(e, checkMax));
		win.on('mouseup.media', e => this.onResizeEnd(e, checkMax));
	};
	
	onResizeMove (e: any, checkMax: boolean) {
		e.preventDefault();
		e.stopPropagation();
		
		if (!this._isMounted) {
			return;
		};
		
		const node = $(this.node);
		const wrap = node.find('.wrap');
		
		if (!wrap.length) {
			return;
		};
		
		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = this.getWidth(checkMax, e.pageX - rect.x + 20);
		
		wrap.css({ width: (w * 100) + '%' });
	};
	
	onResizeEnd (e: any, checkMax: boolean) {
		if (!this._isMounted) {
			return;
		};
		
		const { rootId, block } = this.props;
		const { id } = block;
		const node = $(this.node);
		const wrap = node.find('.wrap');
		
		if (!wrap.length) {
			return;
		};
		
		const win = $(window);
		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = this.getWidth(checkMax, e.pageX - rect.x + 20);
		
		win.off('mousemove.media mouseup.media');
		$(`#block-${block.id}`).removeClass('isResizing');
		keyboard.disableSelection(false);
		keyboard.setResize(false);
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { width: w } },
		]);
	};
	
	getWidth (checkMax: boolean, v: number): number {
		const { block } = this.props;
		const { id, fields } = block;
		const width = Number(fields.width) || 1;
		const el = $(`#selectionTarget-${id}`);

		if (!el.length) {
			return width;
		};
		
		const rect = el.get(0).getBoundingClientRect() as DOMRect;
		const w = Math.min(rect.width, Math.max(160, checkMax ? width * rect.width : v));
		
		return Math.min(1, Math.max(0, w / rect.width));
	};
	
});

export default BlockVideo;