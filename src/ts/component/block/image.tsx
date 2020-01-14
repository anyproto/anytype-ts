import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InputWithFile, Loader, Icon } from 'ts/component';
import { I, C, cache } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockFile {
	dataset?: any;
	commonStore?: any;
	blockStore?: any;
	width?: any;
	rootId: string;
};

interface State {
	size: any;
};

const $ = require('jquery');
const fs = window.require('fs');
const Constant = require('json/constant.json');

@inject('commonStore')
@inject('blockStore')
@observer
class BlockImage extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	state = {
		size: null as any
	};
	
	constructor (props: any) {
		super(props);
		
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResize = this.onResize.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.resize = this.resize.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	};

	render () {
		const { commonStore, content } = this.props;
		const { state, hash } = content;
		const accept = [ 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp' ];
		
		let element = null;
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
					<div className="wrap">
						<img className="img" src={commonStore.imageUrl(hash, 1024)} />
						<Icon className="resize" onMouseDown={this.onResizeStart} />
						<Icon className="dots" />
					</div>
				);
				break;
				
			case I.FileState.Error:
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
		
		this.unbind();
		
		if (selection) {
			selection.hide();
			selection.setBlocked(true);
		};
		
		node.addClass('isResizing');
		win.on('mousemove.image', (e: any) => { this.onResize(e); });
		win.on('mouseup.image', (e: any) => { this.onResizeEnd(e); });
	};
	
	onResize (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		const node = $(ReactDOM.findDOMNode(this));
		const image = node.find('.img');
		
		if (!image.length) {
			return;
		};
		
		const { size } = this.state;
		const rect = (image.get(0) as Element).getBoundingClientRect() as DOMRect;
		
		let width = this.checkWidth(e.pageX - rect.x + 20);
		let height = width / size.div;
		
		image.css({ width: width, height: height });
	};
	
	onResizeEnd (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset;
		const node = $(ReactDOM.findDOMNode(this));
		
		this.unbind();
		
		if (selection) {
			selection.setBlocked(false);
		};
		
		node.removeClass('isResizing');
	};
	
	resize (w: number) {
		const node = $(ReactDOM.findDOMNode(this));
		const image = node.find('.img');
		const { size } = this.state;
		
		let width = this.checkWidth((Constant.size.editorPage - Constant.size.blockMenu) * w);
		let height = width / size.div;
		
		image.css({ width: width, height: height });
	};
	
	unbind () {
		$(window).unbind('mousemove.image mouseup.image');
	};
	
	checkWidth (v: number) {
		const { fields } = this.props;
		const width = fields.width || this.props.width || 1;
		const max = Math.floor((Constant.size.editorPage + Constant.size.blockMenu) * width - Constant.size.blockMenu);
		return Math.max(20, Math.min(max, v));
	};
	
};

export default BlockImage;