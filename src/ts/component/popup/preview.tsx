import React, { forwardRef, useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Loader, Icon, ObjectName } from 'Component';
import { I, S, J, U, keyboard, sidebar, translate } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Mousewheel, Thumbs, Navigation, Zoom } from 'swiper/modules';

const BORDER = 16;
const WIDTH_VIDEO = 1040;
const HEIGHT_VIDEO = 585;

const HEIGHT_HEADER = 52;
const HEIGHT_FOOTER = 96;

const PopupPreview = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close, getId } = props;
	const { data } = param;
	const { gallery } = data;
	const initial = data.initialIdx || 0;
	const [ current, setCurrent ] = useState(null);
	const swiperRef = useRef(null);
	const thumbsRef = useRef(null);
	const galleryMapRef = useRef(new Map());

	const unbind = () => {
		$(window).off('resize.popupPreview keydown.popupPreview');
	};

	const rebind = () => {
		unbind();

		const win = $(window);
		win.on('resize.popupPreview', () => reload());
	};

	const setCurrentItem = (idx?: number) => {
		const initialIdx = data.initialIdx || 0;

		if (!idx) {
			idx = initialIdx;
		};

		const item = gallery[idx];

		if (item && item.object) {
			setCurrent(item.object);
		};
	};

	const onMore = (e: any) => {
		e.stopPropagation();
		e.preventDefault();

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

	const onError = (idx: number) => {
		const node = $(`#${getId()}-innerWrap`);
		const wrap = node.find(`#itemPreview-${idx}`);

		if (!wrap.length) {
			return;
		};

		const obj = galleryMapRef.current.get(idx);
		if (!obj) {
			return;
		};

		wrap.addClass('brokenMedia');
		wrap.find('.loader').remove();

		obj.isLoaded = true;
		galleryMapRef.current.set(idx, obj);
	};

	const getMaxWidthHeight = () => {
		const { ww, wh } = U.Common.getWindowDimensions();
		const maxHeight = wh - (HEIGHT_FOOTER + HEIGHT_HEADER);
		const maxWidth = ww - BORDER * 2 - sidebar.getDummyWidth();

		return { maxWidth, maxHeight };
	};

	const resizeMedia = (idx: number, width: number, height: number) => {
		const { maxWidth, maxHeight } = getMaxWidthHeight();
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

	const resize = (idx: number) => {
		const node = $(`#${getId()}-innerWrap`);
		const element = node.find(`#itemPreview-${idx}`);
		const loader = element.find('.loader');
		const obj = galleryMapRef.current.get(idx);
		const { src, type, isLoaded, width, height } = obj;

		switch (type) {
			case I.FileType.Image: {
				if (isLoaded) {
					if (width && height) {
						resizeMedia(idx, width, height);
					};
					break;
				};

				const img = new Image();
				img.onload = () => {
					obj.width = img.width;
					obj.height = img.height;
					obj.isLoaded = true;

					loader.remove();

					resizeMedia(idx, obj.width, obj.height);
					galleryMapRef.current.set(idx, obj);
				};

				img.onerror = () => onError(idx);
				img.src = src;
				break;
			};

			case I.FileType.Video: {
				if (isLoaded) {
					if (width && height) {
						resizeMedia(idx, width, height);
					};
					break;
				};

				const video = element.find('video');
				if (!video.length) {
					break;
				};

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

					galleryMapRef.current.set(idx, obj);
					resizeMedia(idx, w, h);
					video.css({ width: '100%', height: '100%' });
				};
				videoEl.onerror = () => onError(idx);

				video.css({ width: w, height: h });
				break;
			};
		};
	};

	const reload = () => {
		gallery.forEach((el, idx) => {
			const { src, type } = el;

			if (!galleryMapRef.current.get(idx)) {
				galleryMapRef.current.set(idx, { src, type, isLoaded: false });
			};

			resize(idx);
		});
	};

	useEffect(() => {
		reload();
		rebind();
		setCurrentItem();

		return () => {
			unbind();
		};
	}, []);

	const getContent = (item: any, idx: number, isThumb?: boolean) => {
		const { src, type } = item;
		const id = U.Common.toCamelCase([ 'item', (isThumb ? 'thumb' : 'preview'), idx ].join('-'));
		const loader = !isThumb ? <Loader className="loader" /> : '';
		const cn = [ 'previewItem' ];

		let content = null;

		switch (type) {
			case I.FileType.Image: {
				content = (
					<div className="swiper-zoom-container">
						<img className="media" src={src} onDragStart={e => e.preventDefault()} />
					</div>
				);
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
							<Icon id="button-header-more" tooltipParam={{ text: translate('commonMenu') }} className="more" onClick={onMore} />
						</div>
					</>
				) : ''}
			</div>

			<div className="gallerySlides">
				<Swiper
					onSwiper={swiper => swiperRef.current = swiper}
					initialSlide={initial}
					spaceBetween={0}
					slidesPerView={1}
					centeredSlides={true}
					keyboard={{ enabled: true }}
					mousewheel={true}
					thumbs={{ swiper: thumbsRef.current }}
					zoom={true}
					navigation={true}
					loop={false}
					modules={[ Mousewheel, Keyboard, Thumbs, Navigation, Zoom ]}
					onTransitionEnd={data => setCurrentItem(data.activeIndex)}
				>
					{gallery.map((item: any, i: number) => (
						<SwiperSlide key={i}>
							{getContent(item, i)}
							<div className="innerDimmer" onClick={() => close()} />
						</SwiperSlide>
					))}
				</Swiper>
			</div>

			<div className="galleryFooter">
				{gallery.length > 1 ? (
					<div className="thumbnails">
						<Swiper
							onSwiper={swiper => thumbsRef.current = swiper}
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

}));

export default PopupPreview;