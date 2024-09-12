import * as React from 'react';
import $ from 'jquery';
import { Loader, Icon, ObjectName } from 'Component';
import { I, S, J, U, keyboard, sidebar } from 'Lib';

const BORDER = 16;
const WIDTH_DEFAULT = 450;
const HEIGHT_DEFAULT = 300;
const WIDTH_VIDEO = 1040;
const HEIGHT_VIDEO = 585;

class PopupPreview extends React.Component<I.Popup> {
	
	isLoaded = false;
	width = 0;
	height = 0;

	constructor (props: I.Popup) {
		super(props);

		this.onMore = this.onMore.bind(this);
	};

	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { src, type, object } = data;

		let content = null;
		let name = null;
		let menu = null;

		switch (type) {
			case I.FileType.Image: {
				content = <img className="media" src={src} onClick={() => close()} onDragStart={e => e.preventDefault()} />;
				break;
			};

			case I.FileType.Video: {
				content = <video src={src} controls={true} autoPlay={true} loop={true} />;
				break;
			};
		};

		if (object) {
			name = <ObjectName object={object} />;
			menu = <Icon id="button-header-more" tooltip="Menu" className="more" onClick={this.onMore} />;
		};

		return (
			<div>
				<Loader id="loader" />
				<div className="head">
					<div className="side left">
					</div>
					<div className="side center">
						{name}
					</div>
					<div className="side right">
						{menu}
					</div>
				</div>
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
	
	onMore () {
		const { param, getId } = this.props;
		const { data } = param;
		const { object } = data;

		S.Menu.open('object', {
			element: `#${getId()} #button-header-more`,
			horizontal: I.MenuDirection.Right,
			subIds: J.Menu.object,
			data: {
				rootId: object.id,
				blockId: object.id,
				blockIds: [ object.id ],
				object,
				isFilePreview: true,
			}
		});
	};

	resize () {
		const { param, getId, position } = this.props;
		const { data } = param;
		const { src, type } = data;
		const obj = $(`#${getId()}-innerWrap`);
		const wrap = obj.find('#wrap');
		const loader = obj.find('#loader');
		const { ww, wh } = U.Common.getWindowDimensions();
		const mh = wh - BORDER * 2;
		const mw = ww - BORDER * 2 - sidebar.getDummyWidth();;

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
				const videoEl = video.get(0);
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
			h = w / (width / height);
		} else {
			h = Math.min(maxHeight, height);
			w = h / (height / width);
		};

		wrap.css({ width: w, height: h });
		position();
	};

};

export default PopupPreview;