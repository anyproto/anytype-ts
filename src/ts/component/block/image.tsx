import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InputWithFile, Loader, Icon, Error } from 'ts/component';
import { I, C, DataUtil, focus } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockFile {
	dataset?: any;
	width?: any;
	rootId: string;
};

const $ = require('jquery');
const fs = window.require('fs');
const Constant = require('json/constant.json');

@observer
class BlockImage extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	
	constructor (props: any) {
		super(props);
		
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResize = this.onResize.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onMenuDown = this.onMenuDown.bind(this);
		this.onMenuClick = this.onMenuClick.bind(this);
	};

	render () {
		const { content, fields, id } = this.props;
		const { width } = fields;
		const { state } = content;
		const accept = [ 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp' ];
		
		let element = null;
		let css: any = {};
		
		if (width) {
			css.width = width;
		};
		
		switch (state) {
			default:
			case I.FileState.Empty:
				element = (
					<InputWithFile icon="image" textFile="Upload a picture" accept={accept} onChangeUrl={this.onChangeUrl} onChangeFile={this.onChangeFile} />
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
						<img className="media" src={this.getUrl()} onDragStart={(e: any) => { e.preventDefault(); }} onClick={this.onClick} />
						<Icon className="resize" onMouseDown={(e: any) => { this.onResizeStart(e, false); }} />
						<Icon id={'block-image-menu-' + id} className="dots" onMouseDown={this.onMenuDown} onClick={this.onMenuClick} />
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
		node.css({ width: this.getWidth(checkMax, e.pageX - rect.x + 20) });
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
		
		win.unbind('mousemove.media mouseup.media');
		
		if (selection) {
			selection.setPreventSelect(false);
		};
		
		node.removeClass('isResizing');
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { width: this.getWidth(checkMax, e.pageX - rect.x + 20) } },
		]);
	};
	
	onClick (e: any) {
		if (e.shiftKey || e.ctrlKey || e.metaKey) {
			return;
		};
		
		commonStore.popupOpen('preview', {
			data: {
				type: I.FileType.Image,
				url: this.getUrl(),
			}
		});
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
			element: '#block-image-menu-' + id,
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
	
	getUrl () {
		const { content } = this.props;
		const { state, hash } = content;
		
		return commonStore.imageUrl(hash, Constant.size.image);
	};
	
	getWidth (checkMax: boolean, v: number): number {
		const { id, fields } = this.props;
		const { width } = fields;
		
		const el = $('.selectable.c' + $.escapeSelector(id));
		if (!el.length) {
			return width;
		};
		
		return Math.min(el.width(), Math.max(160, checkMax ? width : v));
	};
	
};

export default BlockImage;