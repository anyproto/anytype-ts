import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InputWithFile, Loader, Error, Pager } from 'ts/component';
import { I, C, translate, focus, Action, Util, DataUtil, FileUtil, Renderer } from 'ts/lib';
import { commonStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = 'workers/pdf.min.js';

interface Props extends I.BlockComponent {};

const { app } = window.require('@electron/remote');
const userPath = app.getPath('userData');
const path = window.require('path');
const Constant = require('json/constant.json');

interface State {
	pages: number;
	page: number;
};

const BlockPdf = observer(class BlockPdf extends React.Component<Props, State> {
	
	state = {
		pages: 0,
		page: 1,
	};
	height: number = 0;

	constructor (props: any) {
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
		const { state, hash, type, mime } = content;		
		const { page, pages } = this.state;

		let object = detailStore.get(rootId, content.hash, [ 'sizeInBytes' ]);
		if (object._empty_) {
			object = Util.objectCopy(content);
			object.sizeInBytes = object.size;
		};

		let { name, sizeInBytes } = object;

		let { width } = fields;
		let element = null;
		let pager = null;
		let css: any = {};
		
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
							textFile="Upload a PDF file" 
							accept={Constant.extension.pdf} 
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
							onChange={(page: number) => { this.setState({ page }); }} 
						/>
					);
				};

				element = (
					<div className={[ 'wrap', 'pdfWrapper', (pager ? 'withPager' : '') ].join(' ')} style={css}>
						<div className="info" onMouseDown={this.onOpen}>
							<span className="name">{name}</span>
							<span className="size">{FileUtil.size(sizeInBytes)}</span>
						</div>

						<Document
							file={commonStore.fileUrl(hash)}
							onLoadSuccess={this.onDocumentLoad}
							renderMode="canvas"
							loading={<Loader />}
							onClick={this.onClick}
						>
							<Page 
								pageNumber={page} 
								loading={<Loader />} 
								onRenderSuccess={this.onPageRender}
							/>
						</Document>

						{pager}
					</div>
				);
				break;
		};
		
		return (
			<div className={[ 'focusable', 'c' + id ].join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{element}
			</div>
		);
	};
	
	onKeyDown (e: any) {
		const { onKeyDown } = this.props;
		
		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 });
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 });
		};
	};

	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
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
		const { block } = this.props;
		const { content } = block;
		const { hash } = content;
		
		C.FileDownload(hash, path.join(userPath, 'tmp'), (message: any) => {
			if (message.path) {
				Renderer.send('pathOpen', message.path);
			};
		});
	};

	onDocumentLoad (result: any) {
		const { numPages } = result;
		this.setState({ pages: numPages });
	};

	onPageRender () {
		const node = $(ReactDOM.findDOMNode(this));
		const wrap = node.find('.wrap');

		this.height = wrap.outerHeight();
	};

	onClick (e: any) {
		if (e.shiftKey || e.ctrlKey || e.metaKey) {
			return;
		};

		const { block } = this.props;
		const { content } = block;
		const { hash } = content;

		DataUtil.objectOpenPopup({ id: hash, layout: I.ObjectLayout.Image });
	};

});

export default BlockPdf;