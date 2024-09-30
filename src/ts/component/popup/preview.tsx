import * as React from 'react';
import $ from 'jquery';
import { Loader, Icon, ObjectName, Checkbox } from 'Component';
import { I, S, J, U, keyboard, sidebar } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Mousewheel } from 'swiper/modules';

const BORDER = 16;
const WIDTH_DEFAULT = 450;
const HEIGHT_DEFAULT = 300;
const WIDTH_VIDEO = 1040;
const HEIGHT_VIDEO = 585;
const HEIGHT_THUMBS = 104;

class PopupPreview extends React.Component<I.Popup> {
	
	isLoaded = false;
	width = 0;
	height = 0;
	swiper = null;
	thumbs = null;
	galleryMap: Map<number, any> = new Map();

	constructor (props: I.Popup) {
		super(props);

		this.onMore = this.onMore.bind(this);
		this.onSlideChange = this.onSlideChange.bind(this);
		this.onError = this.onError.bind(this);
	};

	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { gallery } = data;
		const initial = data.initialIdx || 0;

		const getContent = (item: any, idx: number, isThumb?: boolean) => {
			const { src, type, object } = item;
			const id = U.Common.toCamelCase([ 'item', (isThumb ? 'thumb' : 'preview'), idx ].join('-'));
			const loader = !isThumb ? <Loader className="loader" /> : '';

			const onClick = (e: any) => {
				if (isThumb) {
					e.preventDefault();
					e.stopPropagation();

					if (this.swiper.activeIndex != idx) {
						this.swiper.slideTo(idx);
						this.thumbs.slideTo(idx);
					};
				};
			};

			let head = null;
			let content = null;
			let name = null;
			let menu = null;

			switch (type) {
				case I.FileType.Image: {
					content = <img className="media" src={src} onDragStart={e => e.preventDefault()} />;
					break;
				};

				case I.FileType.Video: {
					content = <video src={src} controls={true} autoPlay={false} loop={true} />;
					break;
				};
			};

			if (!isThumb) {
				if (object) {
					name = <ObjectName object={object} />;
					menu = <Icon id="button-header-more" tooltip="Menu" className="more withBackground" onClick={this.onMore} />;
				};

				head = (
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
				);
			};

			return (
				<div onClick={onClick} id={id} className="previewItem">
					{loader}
					{head}
					<div className="mediaContainer">
						{content}
					</div>
				</div>
			);
		};

		return (
			<div id="wrap" className="wrap">
				<div className="galleryWrapper">
					<div className="gallery">
						<Swiper
							initialSlide={initial}
							spaceBetween={8}
							slidesPerView={1}
							centeredSlides={true}
							keyboard={{ enabled: true }}
							mousewheel={true}
							modules={[ Mousewheel, Keyboard ]}
							onSwiper={swiper => this.swiper = swiper}
							onTransitionEnd={(data) => this.onSlideChange(data)}
						>
							{gallery.map((item: any, i: number) => (
								<SwiperSlide key={i}>
									{getContent(item, i)}
								</SwiperSlide>
							))}
						</Swiper>
					</div>

					<div className="thumbnails">
						<Swiper
							initialSlide={initial}
							spaceBetween={8}
							slidesPerView={10}
							onSwiper={swiper => this.thumbs = swiper}
						>
							{gallery.map((item: any, i: number) => (
								<SwiperSlide key={i}>
									{getContent(item, i, true)}
								</SwiperSlide>
							))}
						</Swiper>
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.onLoad();
		this.rebind();
	};
	
	componentDidUpdate () {
		this.onLoad();
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
		win.on('resize.popupPreview', () => this.onLoad());
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

	onSlideChange (data) {
		if (!this.thumbs && !this.swiper) {
			return;
		};

		if (this.thumbs.activeIndex != data.activeIndex) {
			this.thumbs.slideTo(data.activeIndex);
		};
	};

	onLoad () {
		const { param, getId, position } = this.props;
		const { data } = param;
		const { gallery } = data;

		gallery.forEach((el, idx) => {
			const { src, type } = el;

			if (!this.galleryMap.get(idx)) {
				this.galleryMap.set(idx, { src, type, isLoaded: false });
			};
			this.resize(idx);
		});
	};

	onError (idx) {
		const { getId } = this.props;
		const node = $(`#${getId()}-innerWrap`);
		const wrap = node.find(`#itemPreview-${idx}`);
		const obj = this.galleryMap.get(idx);

		wrap
			.addClass('brokenMedia')
			.find('.loader').remove();

		obj.isLoaded = true;
		this.galleryMap.set(idx, obj);
	};

	resize (idx: number) {
		const { param, getId, position } = this.props;
		const { data } = param;
		const { gallery } = data;
		const isGallery = gallery.length > 1;

		const node = $(`#${getId()}-innerWrap`);
		const wrap = node.find(`#wrap`);
		const element = node.find(`#itemPreview-${idx}`);
		const loader = element.find('.loader')
		const obj = this.galleryMap.get(idx);
		const { src, type, isLoaded, width, height } = obj;
		const { ww, wh } = U.Common.getWindowDimensions();
		const mh = wh - BORDER * 2;
		const mw = ww - BORDER * 2 - sidebar.getDummyWidth();

		if (isGallery) {
			wrap.css({ width: WIDTH_VIDEO, height: HEIGHT_VIDEO + HEIGHT_THUMBS });
			element.css({ width: WIDTH_VIDEO, height: HEIGHT_VIDEO });
			position();
		};

		switch (type) {
			case I.FileType.Image: {
				if (isLoaded) {
					if (width && height) {
						this.resizeImage(mw, mh, width, height);
					};
					break;
				};

				if (!isGallery){
					wrap.css({ width: WIDTH_DEFAULT, height: HEIGHT_DEFAULT });
					position();
				};

				const img = new Image();
				img.onload = () => {
					obj.width = img.width;
					obj.height = img.height;
					obj.isLoaded = true;

					loader.remove();

					this.resizeImage(mw, mh, obj.width, obj.height);
					this.galleryMap.set(idx, obj);
				};

				img.onerror = this.onError;
				img.src = src;
				break;
			};

			case I.FileType.Video: {
				if (isLoaded && !isGallery) {
					position();
					break;
				};

				const video = element.find('video');
				const videoEl = video.get(0);
				const width = WIDTH_VIDEO;
				const height = HEIGHT_VIDEO;

				videoEl.oncanplay = () => {
					loader.remove();
					obj.isLoaded = true;
					this.galleryMap.set(idx, obj);
				};
				videoEl.onerror = this.onError;

				video.css({ width, height });

				if (!isGallery) {
					wrap.css({ width, height });
					position();
				};
			};
		};
	};

	resizeImage (maxWidth: number, maxHeight: number, width: number, height: number) {
		const { param, getId, position } = this.props;
		const { data } = param;
		const { gallery } = data;
		const obj = $(`#${getId()}-innerWrap`);
		const wrap = obj.find('#wrap');

		if (gallery.length > 1) {
			return;
		};

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
