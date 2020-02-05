import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InputWithFile, Loader, Icon, Error } from 'ts/component';
import { I, C, focus } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockFile {
	dataset?: any;
	commonStore?: any;
	blockStore?: any;
	width?: any;
	rootId: string;
};

const $ = require('jquery');
const fs = window.require('fs');
const Constant = require('json/constant.json');

@inject('commonStore')
@inject('blockStore')
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
		const { commonStore, content, fields, id } = this.props;
		const { width } = fields;
		const { state } = content;
		const accept = [ 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp' ];
		
		let element = null;
		let css: any = {};
		
		if (width) {
			css.width = this.checkWidth(width);
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
					<div style={css} className="wrap">
						<img className="img" src={this.getUrl()} onDragStart={(e: any) => { e.preventDefault(); }} onClick={this.onClick} />
						<Icon className="resize" onMouseDown={this.onResizeStart} />
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
	
	onResizeStart (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		const { dataset } = this.props;
		const { selection } = dataset;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		focus.clear();
		this.unbind();
		
		if (selection) {
			selection.hide();
			selection.setPreventSelect(true);
		};
		
		node.addClass('isResizing');
		win.on('mousemove.image', (e: any) => { this.onResize(e); });
		win.on('mouseup.image', (e: any) => { this.onResizeEnd(e); });
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
	
	onClick (e: any) {
		const { commonStore } = this.props;
		
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
		const { commonStore, dataset, id, rootId } = this.props;
		const { selection } = dataset;
		const node = $(ReactDOM.findDOMNode(this));
		
		let ids = [];
		if (selection) {
			selection.setPreventClear(false);
			ids = selection.get();
			if (ids.length <= 1) {
				ids = [ id ];
			};
			selection.set(ids);
			selection.setPreventClear(true);
		};
		
		commonStore.menuOpen('blockAction', { 
			element: 'block-image-menu-' + id,
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				blockId: id,
				blockIds: ids,
				rootId: rootId,
			},
			onClose: () => {
				selection.setPreventClear(false);
			}
		});
	};
	
	getUrl () {
		const { commonStore, content } = this.props;
		const { state, hash } = content;
		
		return commonStore.imageUrl(hash, Constant.size.image);
	};
	
	unbind () {
		$(window).unbind('mousemove.image mouseup.image');
	};
	
	checkWidth (v: number) {
		return Math.max(60, v);
	};
	
};

export default BlockImage;