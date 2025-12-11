import React, { forwardRef, useState, useRef, useEffect } from 'react';
import $ from 'jquery';
import { Title, Label, Button, Icon, IconObject } from 'Component';
import { I, U, S, translate, analytics } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Navigation } from 'swiper/modules';

const SLIDE_COUNT = 5;

const PopupIntroduceChats = forwardRef<{}, I.Popup>(({ param, close }, ref) => {

	const nodeRef = useRef(null);
	const feedRef = useRef(null);
	const [ step, setStep ] = useState(0);
	const [ swiperControl, setSwiperControl ] = useState(null);
	const [ activeSlide, setActiveSlide ] = useState(0);
	const theme = S.Common.getThemeClass();
	const interval = useRef(0);
	const timeout = useRef(0);

	const onStepChange = (idx: number, callBack?: () => void) => {
		setStep(idx);
		callBack?.();

		analytics.event('OnboardingPopup', { id: 'Chats', step: idx + 1 });
	};

	const initGallery = () => {
		const wrapper = $(nodeRef.current).find('.step1');

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => wrapper.removeClass('init'), 600);
	};

	const onSlideChange = () => {
		const idx = swiperControl?.activeIndex || 0;

		setActiveSlide(idx);

		analytics.event('OnboardingPopup', { id: 'Chats', step: idx + 2 });
	};

	useEffect(() => {
		onStepChange(0, () => {
			$(nodeRef.current).find('.step0').removeClass('init');
		});

		return () => {
			window.clearInterval(interval.current);
			window.clearTimeout(timeout.current);
		};
	}, []);

	return (
		<div ref={nodeRef} className={[ 'steps', `s${step}` ].join(' ')}>
			<div className="step0 init">
				<div className="chat" />

				<div className="text">
					<Title text={translate('onboardingChatsTitle')} />
					<Label text={translate('onboardingChatsDescription')} />
					<Button onClick={() => onStepChange(1, initGallery)} text={translate('commonSeeChanges')} className="c48" />
				</div>

				<div className="grad" />
			</div>

			<div className="step1 init">
				{!activeSlide ? <Icon className="slideBack" onClick={() => onStepChange(0)} /> : ''}
				<div className="textWrapper">
					{Array(SLIDE_COUNT).fill(null).map((_, idx: number) => (
						<div key={idx} className={[ 'text', `text${idx}`, idx != activeSlide ? 'hidden' : '' ].join(' ')}>
							<Title className="hidden" text={translate(`onboardingChatsSlide${idx}Title`)} />
							{idx < 4 ? (
								<>
									<Label className="description hidden" text={translate(`onboardingChatsSlide${idx}Text`)} />
									<Label className="count hidden" text={`${idx + 1} / ${SLIDE_COUNT - 1}`} />
								</>
							) : <Button onClick={() => close()} className="c36" text={translate('commonSeeUpdates')} />}
						</div>
					))}
				</div>
				<div className="introWrapper">
					<div className="intro">
						<div className={[ 'img', `slide${activeSlide}` ].join(' ')}>
							<div className="header">
								<div className="mask">
									<Icon />
								</div>
								<div className="dots" />
							</div>
							<div className="sidebar" />
							<div className="oneToOne" />
						</div>
					</div>

					<Swiper
						onSwiper={setSwiperControl}
						speed={800}
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
									{idx == 4 ? (
										<img src={`${U.Common.helpMediaPath()}/onboarding/chats/whatsnew.png`} />
									) : ''}
								</div>
							</SwiperSlide>
						))}
					</Swiper>
				</div>
			</div>
		</div>
	);

});

export default PopupIntroduceChats;
