import React, { forwardRef, useState, useRef, useEffect } from 'react';
import $ from 'jquery';
import { Title, Label, Button, Icon, IconObject } from 'Component';
import { I, U, S, translate, analytics } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Navigation } from 'swiper/modules';

const SLIDE_COUNT = 4;

const PopupIntroduceChats = forwardRef<{}, I.Popup>(({ param, close }, ref) => {

	const nodeRef = useRef(null);
	const feedRef = useRef(null);
	const [ step, setStep ] = useState(0);
	const [ swiperControl, setSwiperControl ] = useState(null);
	const [ activeSlide, setActiveSlide ] = useState(0);
	const theme = S.Common.getThemeClass();
	const interval = useRef(0);
	const timeout = useRef(0);
	const feedHeight = useRef(0);
	const animationDone = useRef(false);

	const now = U.Date.now();
	const profile = U.Space.getProfile();

	const chatMock = [
		{
			id: 'message0',
			isSelf: false,
			isFirst: true,
			isLast: true,
			text: translate('onboardingChatsMockChatMessage0'),
			author: 'Alice',
			userpic: 'alice',
			time: now - 60, // sent 1 minute ago
		},
		{
			id: 'message1',
			isSelf: true,
			isFirst: true,
			isLast: false,
			text: translate('onboardingChatsMockChatMessage1'),
			author: profile.name,
			userpic: 'self',
			time: now,
		},
		{
			id: 'message2',
			isSelf: true,
			isFirst: false,
			isLast: true,
			text: '',
			author: profile.name,
			userpic: 'self',
			time: now,
			withAttachment: true,
		},
		{
			id: 'message3',
			isSelf: false,
			isFirst: true,
			isLast: true,
			text: translate('onboardingChatsMockChatMessage3'),
			author: 'Bob',
			userpic: 'bob',
			time: now,
		},
	];

	const onStepChange = (idx: number, callBack?: () => void) => {
		setStep(idx);
		if (callBack) {
			callBack();
		};

		analytics.event('OnboardingPopup', { id: 'Chats', step: idx + 1 });
	};

	const animateChatMessage = (idx: number) => {
		if (!chatMock[idx]) {
			return;
		};

		const message = chatMock[idx];
		const messageNode = $(feedRef.current).find(`.${message.id}`);

		feedHeight.current = messageNode.outerHeight(true) + feedHeight.current;
		$(feedRef.current).css({ height: feedHeight.current });

		window.setTimeout(() => {
			messageNode.addClass('show');
			if (idx > 0) {
				const prev = chatMock[idx - 1];

				if (prev.author == message.author) {
					$(feedRef.current).find(`.${prev.id}`).addClass('stack');
				};
			};

			window.setTimeout(() => {
				animateChatMessage(idx + 1);
			}, 300 + Math.random() * 200);
		}, 500);
	};

	const initChat = () => {
		const wrapper = $(nodeRef.current).find('.step0');

		window.setTimeout(() => {
			wrapper.removeClass('init');
			animationDone.current = true;
			animateChatMessage(0);
		}, 300);
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

	const Message = (item: any) => {
		const { id, isSelf, isFirst, isLast, text, author, time, withAttachment, userpic } = item;
		const cn = [
			'message',
			id,
			isSelf ? 'isSelf' : '',
			isFirst ? 'isFirst' : '',
			isLast ? 'isLast' : '',
			text ? 'withText' : '',
		];

		return (
			<div className={cn.join(' ')}>
				<div className="flex">
					<div className="side left"><div className={`userpic ${userpic}`} /></div>
					<div className="side right">
						<Label className="author" text={author} />

						<div className="bubbleOuter">
							<div className="bubbleInner">
								<div className="bubble">
									{withAttachment ? (
										<div className="attachment">
											<IconObject size={56} iconSize={32} object={{ iconEmoji: '🗒️' }} />
											<div className="info">
												<Title text={translate('onboardingChatsMockChatAttachmentTitle')} />
												<Label text={translate('onboardingChatsMockChatAttachmentType')} />
											</div>
										</div>
									) : (
										<div className="textWrapper">
											<Label className="text" text={text} />
											<Label className="time" text={U.Date.date('H:i', time)} />
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	useEffect(() => {
		onStepChange(0, initChat);

		return () => {
			window.clearInterval(interval.current);
			window.clearTimeout(timeout.current);
		};
	}, []);

	return (
		<div ref={nodeRef} className={[ 'steps', `s${step}` ].join(' ')}>
			<div className="step0 init">
				<div className={[ 'chat', animationDone.current ? 'animationDone' : '' ].join(' ')}>
					<div ref={feedRef} className="feed">
						{chatMock.map(it => <Message key={it.id} {...it} />)}
					</div>
				</div>

				<Title text={translate('onboardingChatsTitle')} />
				<Label text={translate('onboardingChatsDescription')} />
				<Button onClick={() => onStepChange(1, initGallery)} text={translate('commonSeeChanges')} className="c42" />
			</div>

			<div className="step1 init">
				{!activeSlide ? <Icon className="slideBack" onClick={() => onStepChange(0)} /> : ''}
				<div className="textWrapper">
					{Array(SLIDE_COUNT).fill(null).map((_, idx: number) => (
						<div key={idx} className={[ 'text', `text${idx}`, idx != activeSlide ? 'hidden' : '' ].join(' ')}>
							<Title className="hidden" text={translate(`onboardingChatsSlide${idx}Title`)} />
							{idx < 3 ? (
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
						<div className={[ 'img', `slide${activeSlide}` ].join(' ')} />
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
									{idx == 3 ? (
										<img src={`./img/help/onboarding/chats/${theme ? 'dark/' : ''}${idx}.png`} />
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
