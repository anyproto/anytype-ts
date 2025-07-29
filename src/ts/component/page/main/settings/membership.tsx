import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon } from 'Component';
import { I, S, U, J, Action, translate, analytics, keyboard } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Mousewheel, Navigation } from 'swiper/modules';

const PageMainSettingsMembership = observer(class PageMainSettingsMembership extends React.Component<I.PageSettingsComponent> {

	swiper = null;

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onSwiper = this.onSwiper.bind(this);
		this.onContact = this.onContact.bind(this);
		this.onCode = this.onCode.bind(this);
	};

	render () {
		const { membership } = S.Auth;
		const { membershipTiers, interfaceLang } = S.Common;
		const { status } = membership;
		const tier = U.Data.getMembershipTier(membership.tier);
		const length = membershipTiers.length;
		const cnt = [];

		if (interfaceLang == J.Constant.default.interfaceLang) {
			cnt.push('riccione');
		};

		const links = [
			{ url: J.Url.pricing, name: translate('popupSettingsMembershipLevelsDetails'), type: 'MenuHelpMembershipDetails' },
			{ url: J.Url.privacy, name: translate('popupSettingsMembershipPrivacyPolicy'), type: 'MenuHelpPrivacy' },
			{ url: J.Url.terms, name: translate('popupSettingsMembershipTermsAndConditions'), type: 'MenuHelpTerms' },
		];

		const SlideItem = (slide) => {
			const { id } = slide;
			const title = translate(`popupSettingsMembershipSlide${id}Title`);

			let text = translate(`popupSettingsMembershipSlide${id}Text`);
			if (id == 2) {
				text = U.Common.sprintf(text, J.Url.vision);
			};

			return (
				<div className={[ 'slide', `c${id}` ].join(' ')}>
					<div className="illustration" />
					<div className="text">
						<Title text={title} />
						<Label text={text} />
					</div>
				</div>
			);
		};

		const TierItem = (props: any) => {
			const { item } = props;
			const isCurrent = item.id == membership.tier;
			const price = item.price ? `$${item.price}` : translate('popupSettingsMembershipJustEmail');
			const cn = [ 'tier', `c${item.id}`, item.color ];
			const offer = isCurrent ? translate('popupSettingsMembershipCurrent') : item.offer;

			if (isCurrent) {
				cn.push('isCurrent');
			};

			let period = '';
			let buttonText = translate('popupSettingsMembershipLearnMore');
			let offerLabel = null;

			if (isCurrent) {
				if (membership.status == I.MembershipStatus.Pending) {
					period = translate('popupSettingsMembershipPending');
				} else
				if (item.period && membership.dateEnds) {
					period = U.Common.sprintf(translate('popupSettingsMembershipValidUntil'), U.Date.date('d M Y', membership.dateEnds));
				} else {
					period = translate('popupSettingsMembershipForeverFree');
				};

				buttonText = translate('commonManage');
			} else 
			if (item.period) {
				// default is year
				let periodLabel = translate('pluralYear');
				if (item.periodType) {
					switch (item.periodType) {
						case I.MembershipTierDataPeriodType.PeriodTypeDays: {
							periodLabel = translate('pluralDay');
							break;
						};
						case I.MembershipTierDataPeriodType.PeriodTypeWeeks: {
							periodLabel = translate('pluralWeek');
							break;
						};
						case I.MembershipTierDataPeriodType.PeriodTypeMonths: {
							periodLabel = translate('pluralMonth');
							break;
						};
					};
				};

				if (item.period == 1) {
					period = U.Common.sprintf(translate('popupSettingsMembershipPerGenericSingle'), U.Common.plural(item.period, periodLabel));
				} else {
					period = U.Common.sprintf(translate('popupSettingsMembershipPerGenericMany'), item.period, U.Common.plural(item.period, periodLabel));
				};
			};

			if (offer) {
				offerLabel = <div className="offerLabel">{offer}</div>;
			};

			return (
				<div 
					className={cn.join(' ')}
					onClick={() => S.Popup.open('membership', { data: { tier: item.id } })}
				>
					<div className="top">
						<div className="iconWrapper">
							<Icon />
							{offerLabel}
						</div>

						<Title text={item.name} />
						<Label text={item.description} />
					</div>
					<div className="bottom">
						<div className="priceWrapper">
							<span className="price">{price}</span>{period}
						</div>
						<Button className="c28" text={buttonText} />
					</div>
				</div>
			);
		};

		return (
			<>
				<Title 
					className={cnt.join(' ')} 
					text={!membership.isNone ? translate('popupSettingsMembershipTitle1') : translate('popupSettingsMembershipTitle2')} 
				/>

				{!tier?.price ? (
					<>
						<Label className="description" text={translate('popupSettingsMembershipText')} />

						<Swiper
							className="featuresList"
							spaceBetween={16}
							slidesPerView={1}
							pagination={{ clickable: true }}
							autoplay={{
								waitForTransition: true,
								delay: 4000,
								disableOnInteraction: true,
							}}
							mousewheel={{ forceToAxis: true }}
							navigation={true}
							modules={[ Pagination, Autoplay, Mousewheel, Navigation ]}
							centeredSlides={true}
							loop={true}
							onSwiper={this.onSwiper}
						>
							{Array(4).fill(null).map((item: any, i: number) => (
								<SwiperSlide key={i}>
									<SlideItem key={i} id={i} />
								</SwiperSlide>
							))}
						</Swiper>
					</>
				) : ''}

				<div className="tiers">
					<Swiper
						className="tiersList"
						spaceBetween={16}
						slidesPerView={3}
						mousewheel={{ forceToAxis: true }}
						pagination={membershipTiers.length > 3 ? { clickable: true } : false}
						modules={[ Pagination, Mousewheel ]}
						onSwiper={this.onSwiper}
					>
						{membershipTiers.map((item) => (
							<SwiperSlide key={item.id}>
								<TierItem item={item} />
							</SwiperSlide>
						))}
					</Swiper>
				</div>

				{!tier?.price ? (
					<div className="actionItems">
						<div onClick={this.onCode} className="item redeemCode">
							<Label text={translate('popupSettingsMembershipRedeemCode')} />
							<Icon className="arrow" />
						</div>
					</div>
				) : ''}

				<div className="actionItems">
					{links.map((item, i) => (
						<div key={i} onClick={() => this.onLink(item)} className="item">
							<Label text={item.name} />
							<Icon />
						</div>
					))}
				</div>

				<Label className="special" text={translate('popupSettingsMembershipSpecial')} onClick={this.onContact} />
			</>
		);
	};

	onSwiper (swiper) {
		this.swiper = swiper;
	};

	onLink (item: any) {
		Action.openUrl(item.url);
		analytics.event(item.type, { route: analytics.route.settingsMembership });
	};

	onContact () {
		keyboard.onMembershipUpgradeViaEmail();
		analytics.event('MenuHelpContact', { route: analytics.route.settingsMembership });
	};

	onCode () {
		S.Popup.open('membershipActivation', {});
	};

});

export default PageMainSettingsMembership;
