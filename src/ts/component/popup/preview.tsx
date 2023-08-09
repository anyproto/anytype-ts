import * as React from 'react';
import $ from 'jquery';
import { Loader } from 'Component';
import { I, keyboard, UtilCommon } from 'Lib';
import { commonStore } from 'Store';

const BORDER = 16;
const WIDTH_DEFAULT = 450;
const HEIGHT_DEFAULT = 300;
const WIDTH_VIDEO = 672;
const HEIGHT_VIDEO = 382;

class PopupPreview extends React.Component<I.Popup> {
	
	isLoaded = false;
	width = 0;
	height = 0;

	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { src, type } = data;

		let content = null;

		switch (type) {
			case I.FileType.Image: {
				content = <img className="media" src={src} onClick={() => close()} onDragStart={e => e.preventDefault()} />
				break;
			};

			case I.FileType.Video: {
				content = <video src={src} controls={true} autoPlay={true} loop={true} />;
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
		this.isLoaded = false;
		this.resize();
	};

	componentWillUnmount () {
		this.unbind();
	};

	unbind () {
		$(window).off('resize.popupPreview keydown.popupPreview');
	};

	rebind () {
		this.unbind();

		const win = $(window);
		win.on('resize.popupPreview', () => this.resize());
		win.on('keydown.menu', e => this.onKeyDown(e));
	};

	onKeyDown (e: any) {
		keyboard.shortcut('escape', e, () => this.props.close());
	};
	
	resize () {
		const { param, getId, position } = this.props;
		const { data } = param;
		const { src, type } = data;
		const obj = $(`#${getId()}-innerWrap`);
		const wrap = obj.find('#wrap');
		const loader = obj.find('#loader');
		const { ww, wh } = UtilCommon.getWindowDimensions();
		const mh = wh - BORDER * 2;
		const sidebar = $('#sidebar');

		let mw = ww - BORDER * 2;
		if (commonStore.isSidebarFixed && sidebar.hasClass('active')) {
			mw -= sidebar.outerWidth();
		};

		const onError = () => {
			wrap.addClass('brokenMedia');
			loader.remove();

			this.isLoaded = true;
		};

		switch (type) {
			case I.FileType.Image: {
				if (this.isLoaded) {
					this.resizeImage(mw, mh, this.width, this.height);
					break;
				};

				wrap.css({ width: WIDTH_DEFAULT, height: HEIGHT_DEFAULT });
				position();

				const img = new Image();
				img.onload = () => {
					this.width = img.width;
					this.height = img.height;

					loader.remove();

					this.resizeImage(mw, mh, this.width, this.height);
					this.isLoaded = true;
				};

				img.onerror = onError;
				img.src = src;
				break;
			};

			case I.FileType.Video: {
				if (this.isLoaded) {
					position();
					break;
				};

				const video = obj.find('video');
				const videoEl = video.get(0)
				const width = WIDTH_VIDEO;
				const height = HEIGHT_VIDEO;

				videoEl.oncanplay = () => { 
					loader.remove(); 
					this.isLoaded = true;
				};
				videoEl.onerror = onError;

				wrap.css({ width, height });
				video.css({ width, height });
				position();
			};
		};

	};

	resizeImage (maxWidth: number, maxHeight: number, width: number, height: number) {
		const { getId, position } = this.props;
		const obj = $(`#${getId()}-innerWrap`);
		const wrap = obj.find('#wrap');

		let w = 0, h = 0;
		if (width > height) {
			w = Math.min(maxWidth, width);
			h = Math.min(maxHeight, w / (width / height));
		} else {
			h = Math.min(maxHeight, height);
			w = Math.min(maxWidth, h / (height / width));
		};

		wrap.css({ width: w, height: h });
		position();
	};

};

export default PopupPreview;