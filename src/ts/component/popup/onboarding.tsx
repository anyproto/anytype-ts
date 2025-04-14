import React, { forwardRef, useState, useRef, useEffect } from 'react';
import $ from 'jquery';
import { Title, Label, Button, Icon } from 'Component';
import { I, U, S, translate, analytics } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Navigation } from 'swiper/modules';

const SLIDE_COUNT = 5;

const PopupOnboarding = forwardRef<{}, I.Popup>(({ param, close }, ref) => {

	const nodeRef = useRef(null);
	const [ step, setStep ] = useState(0);
	const [ swiperControl, setSwiperControl ] = useState(null);
	const [ activeSlide, setActiveSlide ] = useState(0);
	const theme = S.Common.getThemeClass();
	const interval = useRef(0);
	const timeout = useRef(0);

	const types = [
		{ id: 'page', name: translate('onboardingPrimitivesTypesPages'), icon: 'document' },
		{ id: 'bookmark', name: translate('onboardingPrimitivesTypesBookmarks'), icon: 'bookmark' },
		{ id: 'contact', name: translate('onboardingPrimitivesTypesContacts'), icon: 'contact' },
		{ id: 'note', name: translate('onboardingPrimitivesTypesNotes'), icon: 'create' },
		{ id: 'task', name: translate('onboardingPrimitivesTypesTasks'), icon: 'checkbox' },
		{ id: 'collection', name: translate('onboardingPrimitivesTypesCollections'), icon: 'layers' },
		{ id: 'goal', name: translate('onboardingPrimitivesTypesGoals'), icon: 'flag' },
		{ id: 'set', name: translate('onboardingPrimitivesTypesQueries'), icon: 'search' },
		{ id: 'book', name: translate('onboardingPrimitivesTypesBooks'), icon: 'book' },
		{ id: 'movie', name: translate('onboardingPrimitivesTypesMovies'), icon: 'film' },
		{ id: 'file', name: translate('onboardingPrimitivesTypesFiles'), icon: 'attach' },
		{ id: 'project', name: translate('onboardingPrimitivesTypesProjects'), icon: 'hammer' },
		{ id: 'video', name: translate('onboardingPrimitivesTypesVideo'), icon: 'videocam' },
		{ id: 'audio', name: translate('onboardingPrimitivesTypesAudio'), icon: 'musical-notes' }
	];

	const onStepChange = (idx: number, callBack?: () => void) => {
		setStep(idx);
		if (callBack) {
			callBack();
		};

		analytics.event('OnboardingPopup', { id: 'Primitives', step: idx + 1 });
	};

	const initTypes = () => {
		const wrapper = $(nodeRef.current).find('.step0');
		const typeIds = types.map(it => it.id);

		interval.current = window.setInterval(() => {
			const idx = Math.floor(Math.random() * typeIds.length);

			wrapper.find(`#type-${typeIds[idx]}`).removeClass('hidden');
			typeIds.splice(idx, 1);

			if (!typeIds.length) {
				window.clearInterval(interval.current);
				window.clearTimeout(timeout.current);

				timeout.current = window.setTimeout(() => wrapper.removeClass('init'), 300);
			};
		}, 100);
	};

	const initGallery = () => {
		const wrapper = $(nodeRef.current).find('.step1');

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => wrapper.removeClass('init'), 600);
	};

	const onSlideChange = () => {
		const idx = swiperControl?.activeIndex || 0;

		setActiveSlide(idx);

		analytics.event('OnboardingPopup', { id: 'Primitives', step: idx + 2 });
	};

	useEffect(() => {
		onStepChange(0, initTypes);

		return () => {
			window.clearInterval(interval.current);
			window.clearTimeout(timeout.current);
		};
	}, []);

	return (
		<div ref={nodeRef} className={[ 'steps', `s${step}` ].join(' ')}>
			<div className="step0 init">
				<div className="types">
					{types.map((type) => {
						const src = U.Object.typeIcon(type.icon, 0, 20, theme ? '#49507A' : '#909cdf');

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
				<Button onClick={() => onStepChange(1, initGallery)} text={translate('onboardingPrimitivesButton')} className="c42" />
			</div>

			<div className="step1 init">
				{!activeSlide ? <Icon className="slideBack" onClick={() => onStepChange(0)} /> : ''}
				<div className="textWrapper">
					{Array(SLIDE_COUNT).fill(null).map((_, idx: number) => (
						<div key={idx} className={[ 'text', `text${idx}`, idx != activeSlide ? 'hidden' : '' ].join(' ')}>
							<Title className="hidden" text={translate(`onboardingPrimitivesSlide${idx}Title`)} />
							{idx < 4 ? (
								<>
									<Label className="description hidden" text={translate(`onboardingPrimitivesSlide${idx}Text`)} />
									<Label className="count hidden" text={`${idx + 1} / ${SLIDE_COUNT - 1}`} />
								</>
							) : <Button onClick={() => close()} className="c36" text={translate('onboardingPrimitivesSlide4Button')} />}
						</div>
					))}
				</div>
				<Swiper
					onSwiper={setSwiperControl}
					speed={400}
					spaceBetween={0}
					slidesPerView={1}
					keyboard={{ enabled: true }}
					navigation={true}
					modules={[ Keyboard, Navigation ]}
					onRealIndexChange={onSlideChange}
				>
					{Array(SLIDE_COUNT).fill(null).map((_, idx: number) => (
						<SwiperSlide key={idx}>
							<div className={[ 'slide', `slide${idx}` ].join(' ')}>
								<img
									onClick={() => swiperControl.slideNext()}
									src={`./img/help/onboarding/primitives/${theme ? 'dark/' : ''}${idx}.png`}
								/>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>
		</div>
	);

});

export default PopupOnboarding;
