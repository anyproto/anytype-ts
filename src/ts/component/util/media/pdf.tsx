import React, { forwardRef, useImperativeHandle, MouseEvent, useRef, useState, useEffect, useMemo } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { Loader } from 'Component';
import { Document, Page, pdfjs } from 'react-pdf';
import { U } from 'Lib';

//pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
pdfjs.GlobalWorkerOptions.workerSrc = './workers/pdf.worker.mjs';

interface Props {
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
	src = '',
	page = 0,
	onDocumentLoad,
	onPageRender,
	onClick,
}, ref) => {

	const [ width, setWidth ] = useState(0);
	const nodeRef = useRef(null);
	const frame = useRef(0);
	const options = useMemo(() => ({
		isEvalSupported: false, 
		cMapUrl: U.Common.fixAsarPath('./cmaps/'),
	}), []);

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
		const resizeObserver = new ResizeObserver(() => {
			raf(() => resize());
		});

		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		return () => {
			raf.cancel(frame.current);
			resizeObserver.disconnect();
		};
	}, []);

	useImperativeHandle(ref, () => ({
		resize,
	}));

	return (
		<div ref={nodeRef} className="mediaPdf">
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