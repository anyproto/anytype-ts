import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon } from 'Component';
import { I, translate, UtilCommon, UtilDate, UtilData } from 'Lib';
import { popupStore, authStore } from 'Store';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import Url from 'json/url.json';

const PopupSettingsPageMembership = observer(class PopupSettingsPageMembership extends React.Component<I.PopupSettings> {

	node: any = null;
	swiper: any = null;

	constructor (props: I.PopupSettings) {
		super(props);

		this.onSwiper = this.onSwiper.bind(this);
	};

	render () {
		const { membership, account } = authStore;
		const hasTier = membership.tier != I.MembershipTier.None;
		const url = Url.membershipSpecial.replace(/\%25accountId\%25/g, account.id);
		const tiers = UtilData.getMembershipTiers().filter(it => it.id >= membership.tier);
		const links = [
			{ url: Url.pricing, name: translate('popupSettingsMembershipLevelsDetails') },
			{ url: Url.privacy, name: translate('popupSettingsMembershipPrivacyPolicy') },
			{ url: Url.terms, name: translate('popupSettingsMembershipTermsAndConditions') },
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

		const TierItem = (item: any) => {
			const isCurrent = item.id == membership.tier;
			const price = item.price ? `$${item.price}` : translate('popupSettingsMembershipJustEmail');

			let period = '';
			let currentLabel = null;
			let buttonText = translate('popupSettingsMembershipLearnMore');

			if (isCurrent) {
				if (item.period && membership.dateEnds) {
					period = UtilCommon.sprintf(translate('popupSettingsMembershipValidUntil'), UtilDate.date('d M Y', membership.dateEnds))
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
				<div 
					className={[ 'tier', `tier${item.idx}`, isCurrent ? 'current' : '' ].join(' ')}
					onClick={() => popupStore.open('membership', { data: { tier: item.id } })}
				>
					<div className="top">
						{currentLabel}
						<div className={[ 'icon', `tier${item.idx}` ].join(' ')} />
						<Title text={translate(`popupSettingsMembershipTier${item.idx}Title`)} />
						<Label text={translate(`popupSettingsMembershipTier${item.idx}Text`)} />
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
			<div ref={node => this.node = node}>
				<div className="membershipTitle">{hasTier ? translate('popupSettingsMembershipTitle1') : translate('popupSettingsMembershipTitle2')}</div>

				{hasTier ? '' : (
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
							modules={[ Pagination, Autoplay ]}
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
				)}

				<div className="tiers">
					{tiers.map((tier, idx) => (
						<TierItem key={idx} {...tier} />
					))}
				</div>

				<div className="actionItems">
					{links.map((item, i) => (
						<div key={i} onClick={() => UtilCommon.onUrl(item.url)} className="item">
							<Label text={item.name} />
							<Icon />
						</div>
					))}
				</div>

				<Label className="special" text={UtilCommon.sprintf(translate('popupSettingsMembershipSpecial'), url)} />
			</div>
		);
	};

	componentDidMount(): void {
		UtilCommon.renderLinks($(this.node));
	};

	onSwiper (swiper) {
		this.swiper = swiper;
	};

});

export default PopupSettingsPageMembership;
