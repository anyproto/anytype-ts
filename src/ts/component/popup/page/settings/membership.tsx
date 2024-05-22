import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon } from 'Component';
import { I, translate, UtilCommon, UtilDate, analytics, keyboard } from 'Lib';
import { popupStore, authStore, commonStore } from 'Store';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Mousewheel } from 'swiper/modules';
const Constant = require('json/constant.json');
const Url = require('json/url.json');

const PopupSettingsPageMembership = observer(class PopupSettingsPageMembership extends React.Component<I.PopupSettings> {

	swiper = null;

	constructor (props: I.PopupSettings) {
		super(props);

		this.onSwiper = this.onSwiper.bind(this);
		this.onContact = this.onContact.bind(this);
	};

	render () {
		const { membership } = authStore;
		const { membershipTiers, interfaceLang } = commonStore;
		const cnt = [];

		if (interfaceLang == Constant.default.interfaceLang) {
			cnt.push('riccione');
		};

		const links = [
			{ url: Url.pricing, name: translate('popupSettingsMembershipLevelsDetails'), type: 'MenuHelpMembershipDetails' },
			{ url: Url.privacy, name: translate('popupSettingsMembershipPrivacyPolicy'), type: 'MenuHelpPrivacy' },
			{ url: Url.terms, name: translate('popupSettingsMembershipTermsAndConditions'), type: 'MenuHelpTerms' },
		];

		const SlideItem = (slide) => (
			<div className={[ 'slide', `c${slide.id}` ].join(' ')}>
				<div className="illustration" />
				<div className="text">
					<Title text={translate(`popupSettingsMembershipSlide${slide.id}Title`)} />
					<Label text={translate(`popupSettingsMembershipSlide${slide.id}Text`)} />
				</div>
			</div>
		);

		const TierItem = (props: any) => {
			const { item } = props;
			const isCurrent = item.id == membership.tier;
			const price = item.price ? `$${item.price}` : translate('popupSettingsMembershipJustEmail');

			let period = '';
			let buttonText = translate('popupSettingsMembershipLearnMore');

			if (isCurrent) {
				if (membership.status == I.MembershipStatus.Pending) {
					period = translate('popupSettingsMembershipPending');
				} else
				if (item.period && membership.dateEnds) {
					period = UtilCommon.sprintf(translate('popupSettingsMembershipValidUntil'), UtilDate.date('d M Y', membership.dateEnds))
				} else {
					period = translate('popupSettingsMembershipForeverFree');
				};

				buttonText = translate('popupSettingsMembershipManage');
			} else 
			if (item.period) {
				if (item.period) {
					if (item.period == 1) {
						period = translate('popupSettingsMembershipPerYear');
					} else {
						period = UtilCommon.sprintf(translate('popupSettingsMembershipPerYears'), item.period, UtilCommon.plural(item.period, translate('pluralYear')));
					};
				};
			};

			return (
				<div 
					className={[ 'tier', `c${item.id}`, item.color, (isCurrent ? 'isCurrent' : '') ].join(' ')}
					onClick={() => popupStore.open('membership', { data: { tier: item.id } })}
				>
					<div className="top">
						<div className="iconWrapper">
							<Icon />
							<div className="current">{translate('popupSettingsMembershipCurrent')}</div>
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
			<React.Fragment>
				<Title 
					className={cnt.join(' ')} 
					text={!membership.isNone ? translate('popupSettingsMembershipTitle1') : translate('popupSettingsMembershipTitle2')} 
				/>

				{(membership.isNone || membership.isExplorer) ? (
					<React.Fragment>
						<Label className="description" text={translate('popupSettingsMembershipText')} />

						<Swiper
							spaceBetween={16}
							slidesPerView={1.15}
							pagination={{ clickable: true }}
							autoplay={{
								waitForTransition: true,
								delay: 4000,
								disableOnInteraction: true,
							}}
							mousewheel={true}
							modules={[ Pagination, Autoplay, Mousewheel ]}
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
					</React.Fragment>
				) : ''}

				<div className="tiers">
					{membershipTiers.map(item => <TierItem key={item.id} item={item} />)}
				</div>

				<div className="actionItems">
					{links.map((item, i) => (
						<div key={i} onClick={() => this.onLink(item)} className="item">
							<Label text={item.name} />
							<Icon />
						</div>
					))}
				</div>

				<Label className="special" text={translate('popupSettingsMembershipSpecial')} onClick={this.onContact} />
			</React.Fragment>
		);
	};

	onSwiper (swiper) {
		this.swiper = swiper;
	};

	onLink (item: any) {
		UtilCommon.onUrl(item.url);
		analytics.event(item.type, { route: analytics.route.settingsMembership });
	};

	onContact () {
		keyboard.onMembershipUpgrade();
		analytics.event('MenuHelpContact', { route: analytics.route.settingsMembership });
	};

});

export default PopupSettingsPageMembership;
