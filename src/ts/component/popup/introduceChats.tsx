import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Title, Label, Button, Icon, } from 'Component';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Navigation } from 'swiper/modules';
import * as I from 'Interface';

const SLIDE_COUNT = 5;

const PopupIntroduceChats = forwardRef<{}, I.Popup>(({ param, close }, ref) => {

	const nodeRef = useRef(null);
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
		const wrapper = U.Dom.select('.step1', nodeRef.current);

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => U.Dom.removeClass(wrapper, 'init'), 600);
	};

	const onSlideChange = () => {
		const idx = swiperControl?.activeIndex || 0;

		setActiveSlide(idx);

		analytics.event('OnboardingPopup', { id: 'Chats', step: idx + 2 });
	};

	useEffect(() => {
		onStepChange(0, () => {
			U.Dom.removeClass(U.Dom.select('.step0', nodeRef.current), 'init');
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
					<Button onClick={() => onStepChange(1, initGallery)} text={translate('commonSeeChanges')} size={48} />
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
							) : <Button onClick={() => close()} size={36} text={translate('commonSeeUpdates')} />}
						</div>
					))}
				</div>
				<div className="introWrapper">
					<div className="intro">
						<div className={[ 'img', `slide${activeSlide}` ].join(' ')}>
							<div className="header">
								<div className="mask">
									<Icon name="header/widget" />
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
