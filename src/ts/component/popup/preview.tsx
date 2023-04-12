import * as React from 'react';
import $ from 'jquery';
import { Loader, } from 'Component';
import { I } from 'Lib';
import { commonStore } from 'Store';
import Constant from 'json/constant.json';

const BORDER = 16;

class PopupPreview extends React.Component<I.Popup> {
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { src, fileType } = data;

		let content = null;

		switch (fileType) {
			case I.FileType.Image: {
				content = <img className="media" src={src} />
				break;
			};

			case I.FileType.Video: {
				content = <video id="videoElement" src={src} controls={true} autoPlay={true} loop={true} />;
				break
			};
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
		const { src, fileType } = data;
		const obj = $(`#${getId()}-innerWrap`);
		const win = $(window);
		const wrap = obj.find('#wrap');
		const loader = obj.find('#loader');
		const mw = win.width() - BORDER * 2;
		const mh = win.height() - BORDER * 2;

		wrap.css({ height: 450, width: 450 });

		const onError = () => {
			wrap.addClass('brokenMedia');
			loader.remove();
		};

		switch (fileType) {
			case I.FileType.Image: {
				const img = new Image();

				img.onload = () => {
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

				img.onerror = onError;

				img.src = src;
				break;
			};

			case I.FileType.Video: {
				const video = document.getElementById('videoElement');

				video.oncanplay = () => {
					const width = 672;
					const height = 372;

					wrap.css({ height, width });
					$(video).css({ height, width });
					loader.remove();
				};

				video.onerror = onError;
			};
		};

	};
	
};

export default PopupPreview;