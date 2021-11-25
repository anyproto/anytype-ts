import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InputWithFile, Icon, Loader, Error, Pager } from 'ts/component';
import { I, C, translate, focus } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = 'workers/pdf.min.js';

interface Props extends I.BlockComponent {}

const $ = require('jquery');
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

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onChangeFile = this.onChangeFile.bind(this);
	}

	render () {
		const { block, readonly } = this.props;
		const { id, fields, content } = block;
		const { state, hash, type, mime } = content;		
		const { page, pages } = this.state;

		let { width } = fields;
		let element = null;
		let pager = null;
		let css: any = {};
		
		if (width) {
			css.width = (width * 100) + '%';
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
				element = (
					<Loader />
				);
				break;
				
			case I.FileState.Done:
				element = (
					<div className="wrap pdfWrapper" style={css}>
						<Document
							file={commonStore.fileUrl(hash)}
							onLoadSuccess={({ numPages }) => { this.setState({ pages: numPages }); }}
							renderMode="svg"
							loading={<Loader />}
						>
							<Page pageNumber={page} loading={<Loader />} />
						</Document>
					</div>
				);

				pager = (
					<Pager 
						offset={page - 1} 
						limit={1} 
						total={pages} 
						pageLimit={2}
						onChange={(page: number) => { this.setState({ page }); }} 
					/>
				);
				break;
		};
		
		return (
			<div className={[ 'focusable', 'c' + id ].join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{element}
				{pager}
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
		
		C.BlockUpload(rootId, id, url, '');
	};
	
	onChangeFile (e: any, path: string) {
		const { rootId, block } = this.props;
		const { id } = block;
		
		C.BlockUpload(rootId, id, '', path);
	};
});

export default BlockPdf;