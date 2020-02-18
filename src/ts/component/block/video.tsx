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
		this.onMenuDown = this.onMenuDown.bind(this);
		this.onMenuClick = this.onMenuClick.bind(this);
		this.onPlay = this.onPlay.bind(this);
	};

	render () {
		const { id, fields, content } = this.props;
		const { width } = fields;
		const { state, hash } = content;
		const accept = [ 'mp4', 'm4v' ];
		
		let element = null;
		let css: any = {};
		
		if (width) {
			css.width = this.checkWidth(width);
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
					<div className="wrap" style={css}>
						<video controls={false} preload="auto" src={commonStore.fileUrl(hash)} />
						<Icon className="play" onClick={this.onPlay} />
						<Icon className="resize" onMouseDown={this.onResizeStart} />
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
	};
	
	componentWillUnmount () {
		this._isMounted = false;
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
	
	onResizeStart (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		const { dataset } = this.props;
		const { selection } = dataset;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		focus.clear(true);
		this.unbind();
		
		if (selection) {
			selection.hide();
			selection.setPreventSelect(true);
		};
		
		node.addClass('isResizing');
		win.on('mousemove.video', (e: any) => { this.onResize(e); });
		win.on('mouseup.video', (e: any) => { this.onResizeEnd(e); });
	};
	
	onResize (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!node.hasClass('wrap')) {
			return;
		};
		
		const rect = (node.get(0) as Element).getBoundingClientRect() as DOMRect;
		node.css({ width: this.checkWidth(e.pageX - rect.x + 20) });
	};
	
	onResizeEnd (e: any) {
		const { dataset, id, rootId } = this.props;
		const { selection } = dataset;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!node.hasClass('wrap')) {
			return;
		};
		
		const rect = (node.get(0) as Element).getBoundingClientRect() as DOMRect;
		
		this.unbind();
		
		if (selection) {
			selection.setPreventSelect(false);
		};
		
		node.removeClass('isResizing');
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { width: this.checkWidth(e.pageX - rect.x + 20) } },
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
	
	unbind () {
		$(window).unbind('mousemove.video mouseup.video');
	};
	
	checkWidth (v: number) {
		return Math.max(60, v);
	};
	
};

export default BlockVideo;