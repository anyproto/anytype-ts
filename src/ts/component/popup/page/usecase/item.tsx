import React, { forwardRef, useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import { Title, Label, Button, Tag, Icon, Loader, Error } from 'Component';
import { I, C, S, U, J, translate, analytics } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Mousewheel } from 'swiper/modules';
import { observer } from 'mobx-react';

const PopupUsecasePageItem = observer(forwardRef<{}, I.PopupUsecase>((props, ref) => {

	const { getAuthor, onAuthor, onPage, getId, close, param } = props;
	const { data } = param;
	const nodeRef = useRef(null);
	const swiperRef = useRef(null);
	const refButton = useRef(null);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ error, setError ] = useState('');
	const route = String(data.route || '');
	const object = data.object || {};
	const author = getAuthor(object.author);
	const screenshots = object.screenshots || [];
	const categories = (object.categories || []).slice(0, 10);
	
	const onSwiper = (swiper) => {
		swiperRef.current = swiper;
		checkArrows();
	};

	const onArrow = (dir: number) => {
		if (swiperRef.current) {
			dir < 0 ? swiperRef.current.slidePrev() : swiperRef.current.slideNext();
		};
	};

	const checkArrows = () => {
		if (!swiperRef.current) {
			return;
		};

		const node = $(nodeRef.current);
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');
		const idx = swiperRef.current.activeIndex;
		const length = (swiperRef.current.slides || []).length;

		arrowLeft.toggleClass('hide', !idx);
		arrowRight.toggleClass('hide', idx >= length - 1);
	};

	const getSpaceOptions = (): any[] => {
		let list: any[] = [
			{ name: translate('popupUsecaseMenuLabel'), isSection: true }
		];

		if (U.Space.canCreateSpace()) {
			list.push({ id: 'add', icon: 'add', name: translate('popupUsecaseSpaceCreate'), isBig: true });
		};

		list = list.concat(U.Space.getList()
			.filter(it => U.Space.canMyParticipantWrite(it.targetSpaceId))
			.map(it => ({ ...it, iconSize: 48, object: it, isBig: true })));
		
		return list;
	};

	const onMenu = () => {
		const cb = (spaceId: string, isNew: boolean) => {
			C.ObjectImportExperience(spaceId, object.downloadLink, object.title, isNew, false, (message: any) => {
				if (!message.error.code) {
					analytics.event('GalleryInstall', { name: object.name, route });
				};
			});
			close();
		};

		S.Menu.open('select', {
			element: `#${getId()} #button-install`,
			offsetY: 2,
			noFlipX: true,
			className: 'spaceSelect',
			data: {
				options: getSpaceOptions(),
				noVirtualisation: true, 
				onSelect: (e: any, item: any) => {
					const isNew = item.id == 'add';

					setIsLoading(true);
					analytics.event('ClickGalleryInstallSpace', { type: isNew ? 'New' : 'Existing', route });

					if (isNew) {
						const details = { 
							name: object.title, 
							iconOption: U.Common.rand(1, J.Constant.count.icon),
							spaceUxType: I.SpaceUxType.Data,
						};

						C.WorkspaceCreate(details, I.Usecase.None, (message: any) => {
							if (!message.error.code) {
								cb(message.objectId, true);

								analytics.event('CreateSpace', { 
									middleTime: message.middleTime, 
									route: analytics.route.gallery, 
									uxType: details.spaceUxType,
								});
							} else {
								setIsLoading(false);
								setError(message.error.description);
							};
						});
					} else {
						cb(item.targetSpaceId, false);
					};
				},
			}
		});

		analytics.event('ClickGalleryInstall', { name: object.name, route });
	};

	useEffect(() => {
		analytics.event('ScreenGalleryInstall', { name: object.name, route });
	}, []);

	return (
		<div ref={nodeRef}>
			{isLoading ? <Loader id="loader" /> : ''}

			<div className="head">
				<div className="inner">
					<div className="element" onClick={() => onPage('', {})}>
						<Icon className="back" />
						{translate('commonBack')}
					</div>
				</div>
			</div>

			<div className="titleWrap">
				<div className="side left">
					<Title text={object.title} />
					<Label text={U.Common.sprintf(translate('popupUsecaseAuthor'), author)} onClick={() => onAuthor(object.author)} />
				</div>
				<div className="side right">
					<Button ref={refButton} id="button-install" text={translate('popupUsecaseInstall')} arrow={true} onClick={onMenu} />
				</div>
			</div>

			<Error text={error} />

			<div className="screenWrap">
				<Swiper 
					spaceBetween={20} 
					slidesPerView={1.05}
					mousewheel={true}
					autoplay={{
						waitForTransition: true,
						delay: 4000,
						disableOnInteraction: true,
					}}
					centeredSlides={true}
					loop={true}
					modules={[ Autoplay, Mousewheel ]}
					onSlideChange={() => checkArrows()}
					onSwiper={swiper => onSwiper(swiper)}
				>
					{screenshots.map((url: string, i: number) => (
						<SwiperSlide key={i}>
							<img className="screen" src={url} />
						</SwiperSlide>
					))}
				</Swiper>

				<Icon id="arrowLeft" className="arrow left" onClick={() => onArrow(-1)} />
				<Icon id="arrowRight" className="arrow right" onClick={() => onArrow(1)} />
			</div>

			<div className="footerWrap">
				<div className="side left">
					<Label text={object.description} />
				</div>
				<div className="side right">
					<div className="tags">
						{categories.map((name: string, i: number) => (
							<Tag key={i} text={name} />
						))}
					</div>
					<Label text={U.Common.sprintf(translate('popupUsecaseUpdated'), U.Date.dateWithFormat(S.Common.dateFormat, U.Date.now()))} />
					<Label text={U.File.size(object.size)} />
				</div>
			</div>
		</div>
	);

}));

export default PopupUsecasePageItem;