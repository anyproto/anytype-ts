import React, { forwardRef, useState, useRef, useEffect } from 'react';
import $ from 'jquery';
import { Title, Label, Button, Icon } from 'Component';
import { I, U, S, J, translate } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Navigation } from 'swiper/modules';

const SLIDE_COUNT = 4;

const PopupOnboarding = forwardRef<{}, I.Popup>(({ param, close }, ref) => {

	const nodeRef = useRef(null);
	const [ step, setStep ] = useState(0);
	const [ swiperControl, setSwiperControl ] = useState(null);
	const [ activeSlide, setActiveSlide ] = useState(0);
	const keys = [
		J.Constant.typeKey.page,
	];
	const types = S.Record.getTypes().filter(it => keys.includes(it.uniqueKey));

	/*
	const types = [
		{ name: translate('onboardingPrimitivesTypesPages'), icon: 'document' },
		{ name: translate('onboardingPrimitivesTypesBookmarks'), icon: 'bookmark' },
		{ name: translate('onboardingPrimitivesTypesContacts'), icon: 'contact' },
		{ name: translate('onboardingPrimitivesTypesNotes'), icon: 'create' },
		{ name: translate('onboardingPrimitivesTypesTasks'), icon: 'checkbox' },
		{ name: translate('onboardingPrimitivesTypesCollections'), icon: 'layers' },
		{ name: translate('onboardingPrimitivesTypesGoals'), icon: 'flag' },
		{ name: translate('onboardingPrimitivesTypesQueries'), icon: 'search' },
		{ name: translate('onboardingPrimitivesTypesBooks'), icon: 'book' },
		{ name: translate('onboardingPrimitivesTypesMovies'), icon: 'film' },
		{ name: translate('onboardingPrimitivesTypesFiles'), icon: 'attach' },
		{ name: translate('onboardingPrimitivesTypesProjects'), icon: 'hammer' },
		{ name: translate('onboardingPrimitivesTypesVideo'), icon: 'videocam' },
		{ name: translate('onboardingPrimitivesTypesAudio'), icon: 'musical-notes' }
	];
	*/
	const slides = [ 0, 1, 2, 3 ];

	const initTypes = () => {
		const wrapper = $(nodeRef.current).find('.step0');
		const typeIds = types.map(it => it.id);

		const interval = window.setInterval(() => {
			const idx = Math.floor(Math.random() * typeIds.length);

			wrapper.find(`#type-${typeIds[idx]}`).removeClass('hidden');
			typeIds.splice(idx, 1);

			if (!typeIds.length) {
				clearInterval(interval);

				window.setTimeout(() => {
					wrapper.removeClass('init');
				}, 300);
			};
		}, 100);
	};

	const initGallery = () => {
		const wrapper = $(nodeRef.current).find('.step1');

		setStep(1);

		window.setTimeout(() => {
			wrapper.removeClass('init');
		}, 600);
	};

	useEffect(() => initTypes(), []);

	return (
		<div ref={nodeRef} className={[ 'steps', `s${step}` ].join(' ')}>
			<div className="step0 init">
				<div className="types">
					{types.map((type) => {
						const src = U.Object.typeIcon(type.iconName, 0, 20, '#909cdf');

						return (
							<div id={`type-${type.id}`} className="type hidden" key={type.id}>
								<img className="icon" src={src} />
								<Label text={type.name} />
							</div>
						);
					})}
				</div>

				<Title text={translate('onboardingPrimitivesTitle')} />
				<Label text={translate('onboardingPrimitivesDescription')} />
				<Button onClick={initGallery} text={translate('onboardingPrimitivesButton')} className="c42" />
			</div>

			<div className="step1 init">
				<div className="textWrapper">
					{Array(SLIDE_COUNT).fill(null).map((_, idx: number) => (
						<div key={idx} className={[ 'text', idx != activeSlide ? 'hidden' : '' ].join(' ')}>
							<Title className="hidden" text={translate(`onboardingPrimitivesSlide${idx}Title`)} />
							<Label className="description hidden" text={translate(`onboardingPrimitivesSlide${idx}Text`)} />
							<Label className="count hidden" text={`${idx + 1} / ${SLIDE_COUNT}`} />
						</div>
					))}
				</div>
				<Swiper
					onSwiper={setSwiperControl}
					spaceBetween={0}
					slidesPerView={1}
					keyboard={{ enabled: true }}
					navigation={true}
					modules={[ Keyboard, Navigation ]}
					onRealIndexChange={() => setActiveSlide(swiperControl?.activeIndex)}
				>
					{Array(SLIDE_COUNT).fill(null).map((_, idx: number) => (
						<SwiperSlide key={idx}>
							<div className={[ 'slide', `slide${idx}` ].join(' ')}>
								<img onClick={() => swiperControl.slideNext()} src={`./img/help/onboarding/primitives/${idx}.png`} />
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>
		</div>
	);

});

export default PopupOnboarding;
