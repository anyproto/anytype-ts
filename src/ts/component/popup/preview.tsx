import React, { forwardRef, useEffect, useRef, useState, MouseEvent } from 'react';
import { Loader, Icon, ObjectName } from 'Component';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Mousewheel, Thumbs, Navigation, Zoom } from 'swiper/modules';
import * as I from 'Interface';

const BORDER = 16;
const WIDTH_VIDEO = 1040;
const HEIGHT_VIDEO = 585;

const HEIGHT_HEADER = 52;
const HEIGHT_FOOTER = 96;

const PopupPreview = forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close, getId } = props;
	const { data } = param;
	const { gallery } = data;
	const initial = data.initialIdx || 0;
	const [ current, setCurrent ] = useState(null);
	const swiperRef = useRef(null);
	const thumbsRef = useRef(null);
	const galleryMapRef = useRef(new Map());
	const nodeRef = useRef(null);

	const resizeHandler = useRef<() => void>(null);

	const unbind = () => {
		if (resizeHandler.current) {
			U.Dom.removeEvent(window, 'resize', resizeHandler.current);
			resizeHandler.current = null;
		};
	};

	const rebind = () => {
		unbind();
		resizeHandler.current = () => reload();
		U.Dom.addEvent(window, 'resize', resizeHandler.current);
	};

	const setCurrentItem = (idx?: number) => {
		if (undefined === idx) {
			idx = data.initialIdx || 0;
		};

		const item = gallery[idx];
		if (item && item.object) {
			setCurrent(item.object);
		};
	};

	const onDimmer = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		const isMedia = U.Dom.hasClass(target, 'mediaContainer') || !!target.closest('.mediaContainer');
		const isArrow = U.Dom.hasClass(target, 'swiper-button-prev') || U.Dom.hasClass(target, 'swiper-button-next');

		if (!isMedia && !isArrow) {
			close();
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
		const node = U.Dom.get(`${getId()}-innerWrap`);
		const wrap = node ? U.Dom.select(`#itemPreview-${idx}`, node) : null;

		if (!wrap) {
			return;
		};

		const obj = galleryMapRef.current.get(idx);
		if (!obj) {
			return;
		};

		U.Dom.addClass(wrap, 'brokenMedia');
		const loader = U.Dom.select('.loader', wrap);
		if (loader) {
			loader.remove();
		};

		obj.isLoaded = true;
		galleryMapRef.current.set(idx, obj);
	};

	const getMaxWidthHeight = () => {
		const { ww, wh } = U.Dom.getWindowDimensions();
		const maxHeight = wh - (HEIGHT_FOOTER + HEIGHT_HEADER) - BORDER * 2;
		const maxWidth = ww - BORDER * 2;

		return { maxWidth, maxHeight };
	};

	const resizeMedia = (idx: number, width: number, height: number) => {
		const { maxWidth, maxHeight } = getMaxWidthHeight();
		const node = U.Dom.get(`${getId()}-innerWrap`);
		const wrap = U.Dom.select(`#itemPreview-${idx} .mediaContainer`, node) as HTMLElement;

		const scale = Math.min(maxWidth / width, maxHeight / height, 1);
		const w = width * scale;
		const h = height * scale;

		if (wrap) {
			U.Dom.css(wrap, { width: `${w}px`, height: `${h}px` });
		};
	};

	const resize = (idx: number) => {
		const node = U.Dom.get(`${getId()}-innerWrap`);
		const element = U.Dom.select(`#itemPreview-${idx}`, node);
		const loader = U.Dom.select('.loader', element);
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

					loader?.remove();

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

				const videoEl = U.Dom.select('video', element) as HTMLVideoElement;
				if (!videoEl) {
					break;
				};

				let w = WIDTH_VIDEO;
				let h = HEIGHT_VIDEO;

				videoEl.onloadedmetadata = () => {
					w = videoEl.videoWidth;
					h = videoEl.videoHeight;

					obj.isLoaded = true;
					obj.width = w;
					obj.height = h;
					loader?.remove();

					galleryMapRef.current.set(idx, obj);
					resizeMedia(idx, w, h);
					U.Dom.css(videoEl, { width: '100%', height: '100%' });
				};
				videoEl.onerror = () => onError(idx);

				U.Dom.css(videoEl, { width: `${w}px`, height: `${h}px` });
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
		resize(initial);
		setCurrentItem();

		return () => {
			unbind();
			galleryMapRef.current.clear();
		};
	}, []);

	useEffect(() => {
		const item = gallery.find(el => el.object?.id == current?.id);

		U.Dom.pauseMedia();

		if (!item) {
			return;
		};

		if (item.type == I.FileType.Video) {
			const video = U.Dom.select('.swiper-slide-active video', nodeRef.current) as HTMLVideoElement;

			if (video) {
				video.currentTime = 0;
				video.play().catch(() => {});
			};
		};

	}, [ current ]);

	const getContent = (item: any, idx: number, isThumb?: boolean) => {
		const { src, type } = item;
		const id = U.String.toCamelCase([ 'item', (isThumb ? 'thumb' : 'preview'), idx ].join('-'));
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
		<div ref={nodeRef} id="wrap" className="wrap">
			<div className="galleryHeader" onClick={onDimmer}>
				{current ? (
					<>
						<div className="side left" />
						<div className="side center">
							<ObjectName object={current} />
						</div>
						<div className="side right">
							<Icon id="button-header-more" tooltipParam={{ text: translate('commonMenu') }} name="common/more" className="more" onClick={onMore} />
						</div>
					</>
				) : ''}
			</div>

			<div className="gallerySlides" onClick={onDimmer}>
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
					onSlideChange={swiper => setCurrentItem(swiper.activeIndex)}
				>
					{gallery.map((item: any, i: number) => (
						<SwiperSlide key={i}>
							{getContent(item, i)}
						</SwiperSlide>
					))}
				</Swiper>
			</div>

			<div className="galleryFooter" onClick={onDimmer}>
				{gallery.length > 1 ? (
					<Swiper
						onSwiper={swiper => thumbsRef.current = swiper}
						spaceBetween={8}
						slidesPerView="auto"
						mousewheel={true}
						modules={[ Thumbs, Mousewheel ]}
						slidesOffsetAfter={BORDER}
						slidesOffsetBefore={BORDER}
					>
						{gallery.map((item: any, i: number) => (
							<SwiperSlide key={i}>
								{getContent(item, i, true)}
							</SwiperSlide>
						))}
					</Swiper>
				) : ''}
			</div>
		</div>
	);

});

export default PopupPreview;