import React, { forwardRef, useImperativeHandle, MouseEvent, useRef, useState, useEffect } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { Loader } from 'Component';
import { Document, Page, pdfjs } from 'react-pdf';
import { U } from 'Lib';
import 'react-pdf/dist/cjs/Page/AnnotationLayer.css';
import 'react-pdf/dist/cjs/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.useWorkerFetch = true;
pdfjs.GlobalWorkerOptions.workerSrc = 'workers/pdf.min.js';

interface Props {
	id: string;
	src: string;
	page: number;
	onDocumentLoad: (result: any) => void;
	onPageRender: () => void;
	onClick: (e: MouseEvent) => void;
};

interface MediaPdfRefProps {
	resize: () => void;
};

const MediaPdf = forwardRef<MediaPdfRefProps, Props>(({
	id = '',
	src = '',
	page = 0,
	onDocumentLoad,
	onPageRender,
	onClick,
}, ref) => {

	const [ width, setWidth ] = useState(0);
	const nodeRef = useRef(null);
	const frame = useRef(0);
	const resizeObserver = new ResizeObserver(() => resize());
	const options = { 
		isEvalSupported: false, 
		cMapUrl: U.Common.fixAsarPath('./cmaps/'),
	};

	const resize = () => {
		if (frame.current) {
			raf.cancel(frame.current);
		};

		frame.current = raf(() => {
			if (nodeRef.current) {
				setWidth($(nodeRef.current).width());
			};
		});
	};

	const onPageRenderHandler = () => {
		onPageRender();
		resize();
	};

	useEffect(() => {
		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		return () => {
			raf.cancel(frame.current);

			if (nodeRef.current) {
				resizeObserver.unobserve(nodeRef.current);
			};
		};
	});

	useImperativeHandle(ref, () => ({
		resize,
	}));

	return (
		<div ref={nodeRef}>
			<Document
				file={src}
				onLoadSuccess={onDocumentLoad}
				renderMode="canvas"
				loading={<Loader />}
				onClick={onClick}
				options={options}
			>
				<Page 
					pageNumber={page} 
					loading={<Loader />}
					width={width}
					onRenderSuccess={onPageRenderHandler}
				/>
			</Document>
		</div>
	);
});

export default MediaPdf;