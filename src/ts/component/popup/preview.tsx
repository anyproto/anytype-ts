import * as React from 'react';
import $ from 'jquery';
import { Loader, } from 'Component';
import { I } from 'Lib';
import { commonStore } from 'Store';
import Constant from 'json/constant.json';

const BORDER = 16;

class PopupPreview extends React.Component<I.Popup> {
	
	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { block } = data;
		const { hash, type } = block.content;

		let content = null;

		switch (type) {
			case I.FileType.Image: {
				content = <img className="media" src={commonStore.imageUrl(hash, Constant.size.image)} />
				break;
			};
		};

		return (
			<div onClick={close}>
				<Loader id="loader" />
				<div id="wrap" className="wrap">
					{content}
				</div>
			</div>
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
		const { hash, type } = block.content;
		const obj = $(`#${getId()}-innerWrap`);
		const win = $(window);
		const wrap = obj.find('#wrap');
		const loader = obj.find('#loader');
		const mw = win.width() - BORDER * 2;
		const mh = win.height() - BORDER * 2;

		wrap.css({ height: 450, width: 450 });

		switch (type) {
			case I.FileType.Image: {
				const img = new Image();
				
				img.onload = function () {
					const cw = img.width;
					const ch = img.height;

					let width = 0, height = 0;
					if (cw > ch) {
						width = Math.min(mw, cw);
						height = Math.min(mh, width / (cw / ch));
					} else {
						height = Math.min(mh, ch);
						width = Math.min(mw, height / (ch / cw));
					};

					wrap.css({ height, width });
					loader.remove();
				};

				img.onerror = function () {
					wrap.addClass('brokenMedia');
					loader.remove();
				};

				img.src = commonStore.imageUrl(hash, Constant.size.image);
				break;
			};
		};
		
	};
	
};

export default PopupPreview;