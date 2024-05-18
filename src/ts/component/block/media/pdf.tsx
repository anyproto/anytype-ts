import * as React from 'react';
import { InputWithFile, Loader, Error, Pager, Icon, MediaPdf, ObjectName } from 'Component';
import { I, C, translate, focus, Action, UtilCommon, UtilObject, UtilFile, Renderer, keyboard } from 'Lib';
import { commonStore, detailStore } from 'Store';
import { observer } from 'mobx-react';
import { pdfjs } from 'react-pdf';
import Constant from 'json/constant.json';

import 'react-pdf/dist/cjs/Page/AnnotationLayer.css';
import 'react-pdf/dist/cjs/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = 'workers/pdf.min.js';

interface State {
	pages: number;
	page: number;
};

const BlockPdf = observer(class BlockPdf extends React.Component<I.BlockComponent, State> {
	
	state = {
		pages: 0,
		page: 1,
	};
	_isMounted = false;
	node: any = null;
	refMedia = null;
	height = 0;

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
		this.onDocumentLoad = this.onDocumentLoad.bind(this);
		this.onPageRender = this.onPageRender.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { id, fields, content } = block;
		const { state, targetObjectId } = content;		
		const { page, pages } = this.state;
		const object = detailStore.get(rootId, targetObjectId, []);
		const width = Number(fields.width) || 0;
		const css: any = {};

		let element = null;
		let pager = null;
		
		if (width) {
			css.width = (width * 100) + '%';
		};

		if (this.height) {
			css.minHeight = this.height;
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
							icon="pdf" 
							textFile={translate('blockPdfUpload')}
							accept={Constant.fileExtension.pdf} 
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
				if (pages > 1) {
					pager = (
						<Pager 
							offset={page - 1} 
							limit={1} 
							total={pages} 
							pageLimit={1}
							isShort={true}
							onChange={page => this.setState({ page })} 
						/>
					);
				};

				element = (
					<div className={[ 'wrap', 'pdfWrapper', (pager ? 'withPager' : '') ].join(' ')} style={css}>
						<div className="info" onMouseDown={this.onOpen}>
							<ObjectName object={object} />
							<span className="size">{UtilFile.size(object.sizeInBytes)}</span>
						</div>

						<MediaPdf 
							id={`pdf-block-${id}`}
							ref={ref => this.refMedia = ref}
							src={commonStore.fileUrl(targetObjectId)}
							page={page}
							onDocumentLoad={this.onDocumentLoad}
							onPageRender={this.onPageRender}
							onClick={this.onClick}
						/>

						{pager}

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

	componentDidMount(): void {
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
		
		this.unbind();
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
		
		Action.upload(I.FileType.Pdf, rootId, id, url, '');
	};
	
	onChangeFile (e: any, path: string) {
		const { rootId, block } = this.props;
		const { id } = block;
		
		Action.upload(I.FileType.Pdf, rootId, id, '', path);
	};

	onOpen (e: any) {
		C.FileDownload(this.props.block.getTargetObjectId(), UtilCommon.getElectron().tmpPath, (message: any) => {
			if (message.path) {
				Renderer.send('pathOpen', message.path);
			};
		});
	};

	onDocumentLoad (result: any) {
		this.setState({ pages: result.numPages });
	};

	onPageRender () {
		const node = $(this.node);
		const wrap = node.find('.wrap');

		this.height = wrap.outerHeight();
	};

	onClick (e: any) {
		if (!keyboard.withCommand(e)) {
			UtilObject.openConfig({ id: this.props.block.getTargetObjectId(), layout: I.ObjectLayout.Pdf });
		};
	};

	onResizeInit () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(this.node);
		const wrap = node.find('.wrap');
		
		if (wrap.length) {
			wrap.css({ width: (this.getWidth(true, 0) * 100) + '%' });
		};

		this.refMedia?.resize();
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

		$(`#block-${block.id}`).addClass('isResizing');

		keyboard.setResize(true);
		keyboard.disableSelection(true);
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
		this.refMedia?.resize();
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
		
		$(`#block-${block.id}`).removeClass('isResizing');

		win.off('mousemove.media mouseup.media');
		keyboard.disableSelection(false);
		keyboard.setResize(false);
		
		this.height = 0;

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

export default BlockPdf;