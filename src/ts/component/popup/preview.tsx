import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Loader, Block } from 'Component';
import { I } from 'Lib';
import { commonStore } from 'Store';

interface Props extends I.Popup, RouteComponentProps<any> {}; 

const $ = require('jquery');
const Constant = require('json/constant.json');
const BORDER = 16;

class PopupPreview extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super (props);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, block } = data;
		const { hash } = block.content;

		let content = null;

		switch (block.content.type) {
			case I.FileType.Image:
				content = <img className="media" src={commonStore.imageUrl(hash, Constant.size.image)} />
				break;
		};

		return (
			<React.Fragment>
				<Loader id="loader" />
				<div id="wrap" className="wrap">
					{content}
				</div>
			</React.Fragment>
		);
	};
	
	componentDidMount () {
		this.resize();
		this.rebind();
	};
	
	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this.unbind();
	};

	unbind () {
		$(window).off('resize.popupPreview');
	};

	rebind () {
		this.unbind();
		$(window).on('resize.popupPreview', () => { this.resize(); });
	};
	
	resize () {
		const { param, getId } = this.props;
		const { data } = param;
		const { block } = data;
		
		const obj = $(`#${getId()}-innerWrap`);
		const win = $(window);
		const wrap = obj.find('#wrap');
		const loader = obj.find('#loader');
		const mw = win.width() - BORDER * 2;
		const mh = win.height() - BORDER * 2;

		wrap.css({ height: 450, width: 450 });

		switch (block.content.type) {
			case I.FileType.Image:
				const img = new Image();
				img.onload = function () {
					loader.remove();
					
					let cw = img.width;
					let ch = img.height;
					let width = 0, height = 0;
					
					if (cw >= ch) {
						width = Math.min(mw, cw);
						height = Math.min(mh, width / (cw / ch));
					} else {
						height = Math.min(mh, ch);
						width = Math.min(mw, height / (ch / cw));
					};

					wrap.css({ height: height, width: width  });
				};
				img.src = commonStore.imageUrl(block.content.hash, Constant.size.image);
				break;
		};
		
	};
	
};

export default PopupPreview;