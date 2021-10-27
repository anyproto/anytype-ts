import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Loader } from 'ts/component';
import { I, Util } from 'ts/lib';

const $ = require('jquery');

interface Props extends I.Popup, RouteComponentProps<any> {}; 

class PopupPreview extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super (props);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { type } = data;
		
		let content = null;
		switch (type) {
			case I.FileType.Image:
				content = <img id="content" />;
				break;
		};
		
		return (
			<div>
				<Loader id="loader" />
				<div id="wrap" className="wrap">
					{content}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.resize();
	};
	
	componentDidUpdate () {
		this.resize();
	};
	
	resize () {
		const { param, position } = this.props;
		const { data } = param;
		const { type, url } = data;
		
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const inner = node.find('#wrap');
		const content = node.find('#content');
		const loader = node.find('.loaderWrapper');

		switch (type) {
			case I.FileType.Image:
				const img = new Image();
				img.onload = function () {
					loader.remove();
					
					let cw = img.width;
					let ch = img.height;
					let mw = win.width() - 68;
					let mh = win.height() - 68;
					let width = 0, height = 0;
					
					if (cw >= ch) {
						width = Math.min(mw, cw);
						height = Math.min(mh, width / (cw / ch));
					} else {
						height = Math.min(mh, ch);
						width = Math.min(mw, height / (ch / cw));
					};
					
					content.css({ width: width }).attr({ src: url });
					inner.css({ height: height });
					
					position();
				};
				img.src = url;
				break;
		};
		
	};
	
};

export default PopupPreview;