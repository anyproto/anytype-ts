import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon, Loader } from 'Component';
import { I, C, translate, UtilCommon, UtilDate, UtilData } from 'Lib';
import { popupStore, authStore } from 'Store';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import arrayMove from 'array-move';
import Url from 'json/url.json';

const PopupSettingsPageMembership = observer(class PopupSettingsPageMembership extends React.Component<I.PopupSettings> {

	state = {
		loading: false,
		currentSlide: 0
	};

	node: any = null;
	swiper: any = null;
	slideWidth: number = 0;

	render () {
		const { membership } = authStore;
		const { loading, currentSlide } = this.state;
		const style = { left: -this.slideWidth * currentSlide };

		let currentTier: I.MembershipTier = I.MembershipTier.None;
		let currentTierValid: number = 0;

		if (membership.tier != I.MembershipTier.None) {
			currentTier = membership.tier;
			if (membership.dateEnds) {
				currentTierValid = membership.dateEnds;
			};
		};

		let slides = [];
		for (let i = 0; i < 4; i++) {
			slides.push({ idx: i, title: translate(`popupSettingsMembershipSlide${i}Title`), text: translate(`popupSettingsMembershipSlide${i}Text`) })
		};
		slides = arrayMove(slides, 3, 0);


		const tiers = UtilData.getMembershipTiers().filter(it => it.id >= currentTier);

		const SlideItem = (slide) => (
			<div className={[ 'slide', `slide${slide.idx}` ].join(' ')}>
				<div className={[ 'illustration', `slide${slide.idx}` ].join(' ')} />
				<div className="text">
					<Title text={slide.title} />
					<Label text={slide.text} />
				</div>
			</div>
		);

		const TierItem = (item: any) => {
			const isCurrent = item.id == currentTier;
			const price = item.price ? `$${item.price}` : translate('popupSettingsMembershipJustEmail');

			let period = '';
			let currentLabel = null;
			let buttonText = translate('popupSettingsMembershipLearnMore');

			if (isCurrent) {
				if (item.period && currentTierValid) {
					period = UtilCommon.sprintf(translate('popupSettingsMembershipValidUntil'), UtilDate.date('d M Y', currentTierValid))
				} else {
					period = translate('popupSettingsMembershipForeverFree');
				};

				currentLabel = <div className="currentLabel">{translate('popupSettingsMembershipCurrent')}</div>;
				buttonText = translate('popupSettingsMembershipManage');
			} else 
			if (item.period) {
				period = item.period == I.MembershipPeriod.Period1Year ? 
					translate('popupSettingsMembershipPerYear') : 
					UtilCommon.sprintf(translate('popupSettingsMembershipPerYears'), item.period);
			};

			return (
				<div className={[ 'tier', `tier${item.idx}`, isCurrent ? 'current' : '' ].join(' ')}>
					<div className="top">
						{currentLabel}
						<div className={[ 'icon', `tier${item.idx}` ].join(' ')} />
						<Title text={translate(`popupSettingsMembershipTitle${item.idx}`)} />
						<Label text={translate(`popupSettingsMembershipDescription${item.idx}`)} />
					</div>
					<div className="bottom">
						<div className="priceWrapper">
							<span className="price">{price}</span>{period}
						</div>
						<Button
							onClick={() => popupStore.open('membership', { data: { tier: item.id } })}
							className="c28"
							text={buttonText}
						/>
					</div>
				</div>
			);
		};

		return (
			<div ref={node => this.node = node}>
				<div className="membershipTitle">{currentTier ? translate('popupSettingsMembership') : translate('popupSettingsMembershipTitle')}</div>

				{loading ? <Loader/> : ''}

				{currentTier ? '' : (
					<React.Fragment>
						<Label className="description" text={translate('popupSettingsMembershipText')} />

						<Swiper
							spaceBetween={16}
							slidesPerView={'auto'}
							initialSlide={1}
							pagination={{
								clickable: true,
							}}
							autoplay={{
								waitForTransition: true,
								delay: 4000,
								disableOnInteraction: false,
							}}
							modules={[Pagination, Autoplay]}
							centeredSlides={true}
							loop={true}
							onSwiper={swiper => this.onSwiper(swiper)}
						>
							{slides.map((slide: any, idx: number) => (
								<SwiperSlide key={idx}>
									<SlideItem key={idx} {...slide} />
								</SwiperSlide>
							))}
						</Swiper>
					</React.Fragment>
				)}

				<div className="tiers">
					{tiers.map((tier, idx) => (
						<TierItem key={idx} {...tier} />
					))}
				</div>

				<div className="actionItems">
					<div className="item">
						<Label text={translate('popupSettingsMembershipLevelsDetails')} />
						<Icon />
					</div>
					<div className="item">
						<Label text={translate('popupSettingsMembershipPrivacyPolicy')} />
						<Icon />
					</div>
					<div className="item">
						<Label text={translate('popupSettingsMembershipTermsAndConditions')} />
						<Icon />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	onSwiper (swiper) {
		this.swiper = swiper;
	};

	resize () {
		this.slideWidth = $(this.node).width() + 16;
	};
});

export default PopupSettingsPageMembership;
