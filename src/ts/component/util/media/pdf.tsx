import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { Loader } from 'Component';
import { Document, Page } from 'react-pdf';
import { throttle } from 'lodash';

interface Props {
	id: string;
	src: string;
	page: number;
	onDocumentLoad: (result: any) => void;
	onPageRender: () => void;
	onClick: (e: any) => void;
};

interface State {
	width: number;
};
	
class MediaPdf extends React.Component<Props, State> {

	_isMounted = false;
	node = null;
	state = {
		width: 0,
	};
	frame = 0;

	render () {
		const { width } = this.state;
		const { src, page, onDocumentLoad, onPageRender, onClick } = this.props;

		return (
			<div ref={ref => this.node = ref}>
				<Document
					file={src}
					onLoadSuccess={onDocumentLoad}
					renderMode="canvas"
					loading={<Loader />}
					onClick={onClick}
				>
					<Page 
						pageNumber={page} 
						loading={<Loader />}
						width={width}
						onRenderSuccess={onPageRender}
					/>
				</Document>
			</div>
		);
	};

	componentDidMount(): void {
		this._isMounted = true;
		this.rebind();

		raf(() => this.resize());
	};

	componentWillUnmount(): void {
		this._isMounted = false;
		this.unbind();
	};

	unbind () {
		$(window).off(`resize.pdf-${this.props.id}`);
	};

	rebind () {
		$(window).on(`resize.pdf-${this.props.id}`, throttle(() => this.resize(), 40));
	};

	resize () {
		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			if (this._isMounted) {
				this.setState({ width: $(this.node).width() });
			};
		});
	};

};

export default MediaPdf;