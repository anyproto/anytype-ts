import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InputWithFile, Loader, Icon } from 'ts/component';
import { I, cache } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockMedia {
	dataset?: any;
	blockStore?: any;
	width?: any;
	rootId: string;
};

interface State {
	image: string;
	size: any;
};

const $ = require('jquery');
const fs = window.require('fs');
const Constant = require('json/constant.json');

@inject('blockStore')
@observer
class BlockImage extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	state = {
		image: '',
		size: null as any
	};
	
	constructor (props: any) {
		super(props);
		
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onResize = this.onResize.bind(this);
		this.onResizeEnd = this.onResizeEnd.bind(this);
		this.resize = this.resize.bind(this);
	};

	render () {
		const { image } = this.state;
		const { blockStore, id, rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == id; });
		
		if (!block) {
			return null;
		};
		
		const { content } = block;
		let { localFilePath, uploadState } = content;
		const accept = [ 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp' ];
		
		if (localFilePath) {
			uploadState = I.ContentUploadState.Done;
		};
		
		let element = null;
		switch (uploadState) {
			default:
			case I.ContentUploadState.Empty:
				element = (
					<InputWithFile icon="image" textFile="Upload a picture" accept={accept} />
				);
				break;
				
			case I.ContentUploadState.Loading:
				element = (
					<Loader />
				);
				break;
				
			case I.ContentUploadState.Done:
				element = (
					<div className="wrap">
						<img className="img" src={image} />
						<Icon className="resize" onMouseDown={this.onResizeStart} />
						<Icon className="dots" />
					</div>
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
		this.load();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	load () {
		const { content } = this.props;
		const { localFilePath, uploadState } = content;
		
		if (!localFilePath/* || (uploadState != I.ContentUploadState.Done)*/) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const image = node.find('.img');
		
		let set = (res: any) => {
			this.setState({ 
				image: 'data:image/jpeg;base64,' + res.image, 
				size: { width: res.width, height: res.height, div: res.div } as any
			});
		};
		let key = [ 'media', localFilePath ].join('.');
		let res = cache.get(key);
		
		if (res) {
			set(res);
			return;
		};
		
		fs.readFile(localFilePath, (err: any, res: any) => {
			if (!this._isMounted) {
				return;
			};
			
			if (err) {
				console.error(err);
				return;
			};
			
			let s = new Buffer(res).toString('base64');
			
			image.on('load', (e: any) => {
				const rect = (image.get(0) as Element).getBoundingClientRect() as DOMRect;
				const res = { image: s, width: rect.width, height: rect.height, div: rect.width / rect.height };
				
				cache.set(key, res);
				set(res);
			});
			image.attr({ src: 'data:image/jpeg;base64,' + s });
		});
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