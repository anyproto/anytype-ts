import * as React from 'react';
import $ from 'jquery';
import { Loader, Icon, ObjectName } from 'Component';
import { I, S, J, U, keyboard, sidebar, translate } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Mousewheel, Thumbs, Navigation } from 'swiper/modules';

interface State {
	current: any;
};

const BORDER = 16;
const WIDTH_VIDEO = 1040;
const HEIGHT_VIDEO = 585;

const HEIGHT_HEADER = 52;
const HEIGHT_FOOTER = 96;

class PopupPreview extends React.Component<I.Popup> {

	swiper = null;
	thumbs = null;
	galleryMap: Map<number, any> = new Map();
	current: any = null;
	state = {
		current: null,
	};

	constructor (props: I.Popup) {
		super(props);

		this.onMore = this.onMore.bind(this);
		this.onError = this.onError.bind(this);
		this.onExpand = this.onExpand.bind(this);
		this.setCurrent = this.setCurrent.bind(this);
	};

	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { gallery } = data;
		const { current } = this.state;
		const initial = data.initialIdx || 0;

		const getContent = (item: any, idx: number, isThumb?: boolean) => {
			const { src, type, object } = item;
			const id = U.Common.toCamelCase([ 'item', (isThumb ? 'thumb' : 'preview'), idx ].join('-'));
			const loader = !isThumb ? <Loader className="loader" /> : '';
			const cn = [ 'previewItem' ];

			let content = null;

			switch (type) {
				case I.FileType.Image: {
					content = <img className="media" src={src} onDragStart={e => e.preventDefault()} />;
					break;
				};

				case I.FileType.Video: {
					cn.push('isVideo');
					content = <video src={src} controls={!isThumb} autoPlay={false} loop={true} />;
					break;
				};
			};

			return (
				<div id={id} className={cn.join(' ')}>
					{loader}
					<div className="mediaContainer">
						{content}
					</div>
					<div className="innerDimmer" onClick={() => close()} />
				</div>
			);
		};

		return (
			<div id="wrap" className="wrap">
				<div className="galleryHeader">
					{current ? (
						<>
							<div className="side left" />
							<div className="side center">
								<ObjectName object={current} />
							</div>
							<div className="side right">
								<Icon id="button-header-more" tooltipParam={{ text: translate('commonMenu') }} className="more" onClick={this.onMore} />
							</div>
						</>
					) : ''}
				</div>

				<div className="gallerySlides">
					<Swiper
						onSwiper={swiper => this.swiper = swiper}
						initialSlide={initial}
						spaceBetween={0}
						slidesPerView={1}
						centeredSlides={true}
						keyboard={{ enabled: true }}
						mousewheel={true}
						thumbs={{ swiper: this.thumbs }}
						navigation={true}
						modules={[ Mousewheel, Keyboard, Thumbs, Navigation ]}
						onTransitionEnd={data => this.setCurrent(data.activeIndex)}
					>
						{gallery.map((item: any, i: number) => (
							<SwiperSlide key={i} onClick={() => close()}>
								{getContent(item, i)}
							</SwiperSlide>
						))}
					</Swiper>
				</div>

				<div className="galleryFooter">
					{gallery.length > 1 ? (
						<div className="thumbnails">
							<Swiper
								onSwiper={swiper => this.thumbs = swiper}
								initialSlide={initial}
								spaceBetween={8}
								slidesPerView="auto"
								modules={[ Thumbs ]}
							>
								{gallery.map((item: any, i: number) => (
									<SwiperSlide key={i}>
										{getContent(item, i, true)}
									</SwiperSlide>
								))}
							</Swiper>

							<div className="innerDimmer" onClick={() => close()} />
						</div>
					) : ''}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.reload();
		this.rebind();
		this.setCurrent();

		// swiper need to catch up with thumbs in case of no objects
		window.setTimeout(() => this.forceUpdate(), 100);
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
		win.on('resize.popupPreview', () => this.reload());
		win.on('keydown.menu', e => this.onKeyDown(e));
	};

	setCurrent (idx?: number) {
		const { param} = this.props;
		const { data } = param;
		const { gallery } = data;
		const initialIdx = data.initialIdx || 0;

		if (!idx) {
			idx = initialIdx;
		};

		const item = gallery[idx];

		if (item && item.object) {
			this.setState({ current: item.object });
		};
	};

	onKeyDown (e: any) {
		keyboard.shortcut('escape', e, () => this.props.close());
	};

	onExpand (e: any) {
		e.stopPropagation();
		e.preventDefault();

		const { current } = this.state;

		S.Popup.closeAll(null, () => {
			if (current) {
				U.Object.openAuto(current);
			};
		});
	};
	
	onMore (e: any) {
		e.stopPropagation();
		e.preventDefault();

		const { getId, close } = this.props;
		const { current } = this.state;

		if (!current) {
			return;
		};

		const cb = () => close();

		S.Menu.open('object', {
			element: `#${getId()} #button-header-more`,
			horizontal: I.MenuDirection.Right,
			subIds: J.Menu.object,
			data: {
				rootId: current.id,
				blockId: current.id,
				blockIds: [ current.id ],
				object: current,
				isFilePreview: true,
				onArchive: cb,
				onDelete: cb,
			}
		});
	};

	onError (idx: number) {
		const { getId } = this.props;
		const node = $(`#${getId()}-innerWrap`);
		const wrap = node.find(`#itemPreview-${idx}`);

		if (!wrap.length) {
			return;
		};

		const obj = this.galleryMap.get(idx);
		if (!obj) {
			return;
		};

		wrap.addClass('brokenMedia');
		wrap.find('.loader').remove();

		obj.isLoaded = true;
		this.galleryMap.set(idx, obj);
	};

	reload () {
		const { param} = this.props;
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

	resize (idx: number) {
		const { getId } = this.props;
		const node = $(`#${getId()}-innerWrap`);
		const element = node.find(`#itemPreview-${idx}`);
		const loader = element.find('.loader');
		const obj = this.galleryMap.get(idx);
		const { src, type, isLoaded, width, height } = obj;

		switch (type) {
			case I.FileType.Image: {
				if (isLoaded) {
					if (width && height) {
						this.resizeMedia(idx, width, height);
					};
					break;
				};

				const img = new Image();
				img.onload = () => {
					obj.width = img.width;
					obj.height = img.height;
					obj.isLoaded = true;

					loader.remove();

					this.resizeMedia(idx, obj.width, obj.height);
					this.galleryMap.set(idx, obj);
				};

				img.onerror = () => this.onError(idx);
				img.src = src;
				break;
			};

			case I.FileType.Video: {
				if (isLoaded) {
					if (width && height) {
						this.resizeMedia(idx, width, height);
					};
					break;
				};

				const video = element.find('video');
				const videoEl = video.get(0);

				let w = WIDTH_VIDEO;
				let h = HEIGHT_VIDEO;

				videoEl.onloadedmetadata = () => {
					w = videoEl.videoWidth;
					h = videoEl.videoHeight;

					obj.isLoaded = true;
					obj.width = w;
					obj.height = h;
					loader.remove();

					this.galleryMap.set(idx, obj);
					this.resizeMedia(idx, w, h);
					video.css({ width: '100%', height: '100%' });
				};
				videoEl.onerror = () => this.onError(idx);

				video.css({ width: w, height: h });
				break;
			};
		};
	};

	resizeMedia (idx: number, width: number, height: number) {
		const { maxWidth, maxHeight } = this.getMaxWidthHeight();
		const { getId } = this.props;
		const obj = $(`#${getId()}-innerWrap`);
		const wrap = obj.find(`#itemPreview-${idx} .mediaContainer`);

		let w = 0, h = 0;
		if ((width > height) && (height < maxHeight)) {
			w = Math.min(maxWidth, width);
			h = w / (width / height);
		} else {
			h = Math.min(maxHeight, height);
			w = h / (height / width);
		};

		wrap.css({ width: w, height: h });
	};

	getMaxWidthHeight () {
		const { ww, wh } = U.Common.getWindowDimensions();
		const maxHeight = wh - (HEIGHT_FOOTER + HEIGHT_HEADER);
		const maxWidth = ww - BORDER * 2 - sidebar.getDummyWidth();

		return { maxWidth, maxHeight };
	};

};

export default PopupPreview;