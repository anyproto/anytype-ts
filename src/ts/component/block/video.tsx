import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InputWithFile, Icon, Loader, Error } from 'ts/component';
import { I, C, DataUtil, focus } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockFile {
	dataset?: any;
	rootId: string;
};

const $ = require('jquery');

@observer
class BlockVideo extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResize = this.onResize.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.onResizeInit = this.onResizeInit.bind(this);
		this.onMenuDown = this.onMenuDown.bind(this);
		this.onMenuClick = this.onMenuClick.bind(this);
		this.onPlay = this.onPlay.bind(this);
	};

	render () {
		const { id, fields, content } = this.props;
		const { state, hash } = content;
		const accept = [ 'mp4', 'm4v' ];
		
		let { width } = fields;
		let element = null;
		let css: any = {};
		
		if (width) {
			css.width = (width * 100) + '%';
			css.height = this.getHeight(width);
		};
		
		switch (state) {
			default:
			case I.FileState.Empty:
				element = (
					<InputWithFile icon="video" textFile="Upload a video" accept={accept} onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} />
				);
				break;
				
			case I.FileState.Uploading:
				element = (
					<Loader />
				);
				break;
				
			case I.FileState.Done:
				element = (
					<div className="wrap resizable" style={css}>
						<video className="media" controls={false} preload="auto" src={commonStore.fileUrl(hash)} />
						<Icon className="play" onClick={this.onPlay} />
						<Icon className="resize" onMouseDown={(e: any) => { this.onResizeStart(e, false); }} />
						<Icon id={'block-video-menu-' + id} className="dots" onMouseDown={this.onMenuDown} onClick={this.onMenuClick} />
					</div>
				);
				break;
				
			case I.FileState.Error:
				element = (
					<Error text="Error" />
				);
				break;
		};
		
		return (
			<React.Fragment>
				{element}
			</React.Fragment>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.bind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	bind () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		
		node.unbind('resizeStart resize resizeEnd');
		node.on('resizeStart', (e: any, oe: any) => { this.onResizeStart(oe, true); });
		node.on('resize', (e: any, oe: any) => { this.onResize(oe, true); });
		node.on('resizeEnd', (e: any, oe: any) => { this.onResizeEnd(oe, true); });
		node.on('resizeInit', (e: any, oe: any) => { this.onResizeInit(); });
	};
	
	unbind () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.unbind('resize');
	};
	
	onChangeUrl (e: any, url: string) {
		const { id, rootId } = this.props;
		C.BlockUpload(rootId, id, url, '');
	};
	
	onChangeFile (e: any, path: string) {
		const { id, rootId } = this.props;
		C.BlockUpload(rootId, id, '', path);
	};
	
	onPlay () {
		const node = $(ReactDOM.findDOMNode(this));
		const video = node.find('video');
		const el = video.get(0);
		
		video.unbind('ended pause play');
		el.play();
		
		video.on('play', () => {
			el.controls = true;
			node.addClass('isPlaying');
		});
		
		video.on('ended', () => {
			el.controls = false;
			node.removeClass('isPlaying');
		});
	};
	
	onResizeInit () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!node.hasClass('wrap')) {
			return;
		};
		
		const w = this.getWidth(true, 0);
		const h = this.getHeight(w);
		
		node.css({ width: (w * 100) + '%', height: h });
	};
	
	onResizeStart (e: any, checkMax: boolean) {
		e.preventDefault();
		e.stopPropagation();
		
		if (!this._isMounted) {
			return;
		};
		
		const { dataset } = this.props;
		const { selection } = dataset;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		focus.clear(true);
		win.unbind('mousemove.media mouseup.media');
		
		if (selection) {
			selection.hide();
			selection.setPreventSelect(true);
		};
		
		node.addClass('isResizing');
		win.on('mousemove.media', (e: any) => { this.onResize(e, checkMax); });
		win.on('mouseup.media', (e: any) => { this.onResizeEnd(e, checkMax); });
	};
	
	onResize (e: any, checkMax: boolean) {
		e.preventDefault();
		e.stopPropagation();
		
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!node.hasClass('wrap')) {
			return;
		};
		
		const rect = (node.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = this.getWidth(checkMax, e.pageX - rect.x + 20);
		const h = this.getHeight(w);
		
		node.css({ width: (w * 100) + '%', height: h });
	};
	
	onResizeEnd (e: any, checkMax: boolean) {
		if (!this._isMounted) {
			return;
		};
		
		const { dataset, id, rootId } = this.props;
		const { selection } = dataset;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!node.hasClass('wrap')) {
			return;
		};
		
		const win = $(window);
		const rect = (node.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = this.getWidth(checkMax, e.pageX - rect.x + 20);
		
		win.unbind('mousemove.media mouseup.media');
		node.removeClass('isResizing');
		
		if (selection) {
			selection.setPreventSelect(false);
		};
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { width: w } },
		]);
	};
	
	onMenuDown (e: any) {
		const { dataset, id, rootId } = this.props;
		const { selection } = dataset;
		
		if (selection) {
			selection.setPreventClear(true);
		};
	};
	
	onMenuClick (e: any) {
		const { dataset, id, rootId } = this.props;
		const { selection } = dataset;
		const node = $(ReactDOM.findDOMNode(this));
		
		commonStore.menuOpen('blockAction', { 
			element: '#block-video-menu-' + id,
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				blockId: id,
				blockIds: DataUtil.selectionGet(this.props),
				rootId: rootId,
			},
			onClose: () => {
				selection.setPreventClear(false);
			}
		});
	};
	
	getWidth (checkMax: boolean, v: number): number {
		const { id, fields } = this.props;
		const { width } = fields;
		
		const el = $('.selectable.c' + $.escapeSelector(id));
		if (!el.length) {
			return width;
		};
		
		const ew = el.width();
		const w = Math.min(ew, Math.max(20, checkMax ? width * ew : v));
		
		return Math.min(1, Math.max(0, w / ew));
	};
	
	getHeight (p: number) {
		const { id } = this.props;
		const el = $('.selectable.c' + $.escapeSelector(id));
		
		if (!el.length) {
			return 0;
		};
		
		return p * el.width() / 16 * 9;
	};
	
};

export default BlockVideo;