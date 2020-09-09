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
		const { type, url } = data;
		
		let content = null;
		switch (type) {
			case I.FileType.Image:
				content = <img id="content" src={url} />;
				break;
		};
		
		return (
			<div>
				<Loader />
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
		const { param } = this.props;
		const { data } = param;
		const { type, url } = data;
		
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const inner = node.find('#wrap');
		const content = node.find('#content');
		const loader = node.find('.loaderWrapper');

		switch (type) {
			case I.FileType.Image:
				content.unbind('load').on('load', () => {
					loader.remove();
					
					let cw = content.width();
					let ch = content.height();
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
					
					content.css({ width: width });
					inner.css({ height: height });
					
					this.props.position();
				});
				break;
		};
		
		this.props.position();
	};
	
};

export default PopupPreview;