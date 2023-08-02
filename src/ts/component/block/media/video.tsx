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
		const { state, hash, type, mime } = content;
		
		let { width } = fields;
		let element = null;
		let css: any = {};
		
		if (width) {
			css.width = (width * 100) + '%';
			css.height = this.getHeight(width);
		};
		
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
							accept={Constant.extension.video} 
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
					<div className="wrap resizable blockVideo" style={css}>
						<MediaVideo
							src={commonStore.fileUrl(hash)}
							onPlay={this.onPlay}
							onPause={this.onPause}
						/>
						<Icon className="resize" onMouseDown={(e: any) => { this.onResizeStart(e, false); }} />
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
	};
	
	componentDidUpdate () {
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(this.node);
		const video = node.find('video');
		const el = video.get(0);
		
		this.unbind();
		
		node.on('resizeStart', (e: any, oe: any) => this.onResizeStart(oe, true));
		node.on('resizeMove', (e: any, oe: any) => this.onResizeMove(oe, true));
		node.on('resizeEnd', (e: any, oe: any) => this.onResizeEnd(oe, true));
		node.on('resizeInit', (e: any, oe: any) => this.onResizeInit());
		
		if (video.length) {
			this.div = 16 / 9;
			this.onResizeInit();

			video.on('canplay', (e: any) => {
				this.div = el.videoWidth / el.videoHeight;
				this.onResizeInit();
			});
		};
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
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
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
		
		const win = $(window);
		const node = $(this.node);
		const wrap = node.find('.wrap');
		
		if (!wrap.length) {
			return;
		};
		
		const w = this.getWidth(true, 0);
		const h = this.getHeight(w);
		
		wrap.css({ width: (w * 100) + '%', height: h });
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
		const node = $(this.node);
		
		focus.set(block.id, { from: 0, to: 0 });
		win.off('mousemove.media mouseup.media');
		
		if (selection) {
			selection.hide();
		};

		keyboard.disableSelection(true);
		node.addClass('isResizing');
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
		const h = this.getHeight(w);
		
		wrap.css({ width: (w * 100) + '%', height: h });
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
		node.removeClass('isResizing');
		keyboard.disableSelection(false);
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { width: w } },
		]);
	};
	
	getWidth (checkMax: boolean, v: number): number {
		const { block } = this.props;
		const { id, fields } = block;
		
		let { width } = fields;
		width = Number(width) || 1;
		
		const el = $('#selectable-' + id);
		if (!el.length) {
			return width;
		};
		
		const rect = el.get(0).getBoundingClientRect() as DOMRect;
		const w = Math.min(rect.width, Math.max(160, checkMax ? width * rect.width : v));
		
		return Math.min(1, Math.max(0, w / rect.width));
	};
	
	getHeight (p: number) {
		const { block } = this.props;
		const el = $('#selectable-' + block.id);
		
		if (!el.length) {
			return 0;
		};
		
		const rect = el.get(0).getBoundingClientRect() as DOMRect;
		return Math.floor(p * rect.width / (this.div || 1));
	};
	
});

export default BlockVideo;