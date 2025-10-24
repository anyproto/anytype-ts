import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon, Switch } from 'Component';
import { I, S, U, J, C, Action, translate, analytics, keyboard } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Mousewheel } from 'swiper/modules';

const PageMainSettingsMembership = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { membership } = S.Auth;
	const { interfaceLang, membershipTiers } = S.Common;
	const { status } = membership;
	const [ showAnnual, setShowAnnual ] = useState(true);
	const tier = U.Data.getMembershipTier(membership.tier);
	const cnt = [];

	if (interfaceLang == J.Constant.default.interfaceLang) {
		cnt.push('riccione');
	};

	const onLink = (item: any) => {
		Action.openUrl(item.url);
		analytics.event(item.type, { route: analytics.route.settingsMembership });
	};

	const onContact = () => {
		keyboard.onMembershipUpgradeViaEmail();
		analytics.event('MenuHelpContact', { route: analytics.route.settingsMembership });
	};

	const onCode = () => {
		S.Popup.open('membershipActivation', {});
	};

	const links = [
		{ url: J.Url.pricing, name: translate('popupSettingsMembershipLevelsDetails'), type: 'MenuHelpMembershipDetails' },
		{ url: J.Url.privacy, name: translate('popupSettingsMembershipPrivacyPolicy'), type: 'MenuHelpPrivacy' },
		{ url: J.Url.terms, name: translate('popupSettingsMembershipTermsAndConditions'), type: 'MenuHelpTerms' },
	];

	const onPay = (item: I.MembershipTier) => {
		if (item.id == membership.tier) {
			C.MembershipGetPortalLinkUrl((message: any) => {
				if (message.url) {
					Action.openUrl(message.url);
				};
			});
		} else {
			C.MembershipRegisterPaymentRequest(item.id, null, '', !showAnnual, (message) => {
				if (message.url) {
					Action.openUrl(message.url);
				};

				analytics.event('ClickMembership', { params: { tier }});
			});
		};
	};

	const TierItem = (props: any) => {
		const { item } = props;
		const isCurrent = item.id == membership.tier;
		const periodPrice = showAnnual ? item.price : item.priceMonthly;
		const price = item.price ? `$${periodPrice}` : translate('popupSettingsMembershipJustEmail');
		const cn = [ 'tier', `c${item.id}`, item.color ];
		const offer = isCurrent ? translate('popupSettingsMembershipCurrent') : item.offer;

		if (isCurrent) {
			cn.push('isCurrent');
		};

		let period = '';
		let buttonText = translate('popupSettingsMembershipSelectPlan');
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
			const periodLabel = showAnnual ? translate('pluralYear') : translate('pluralMonth');

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
				onClick={() => onPay(item)}
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

			<div className="switchWrapper">
				<Label text={translate('popupSettingsMembershipSwitchMonthly')} />
				<Switch
					value={showAnnual}
					onChange={(e, v) => setShowAnnual(v)}
				/>
				<Label text={translate('popupSettingsMembershipSwitchAnnual')} />
			</div>

			<div className="tiers">
				<Swiper
					className="tiersList"
					spaceBetween={16}
					slidesPerView={3}
					mousewheel={{ forceToAxis: true }}
					pagination={membershipTiers.length > 3 ? { clickable: true } : false}
					modules={[ Pagination, Mousewheel ]}
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
					<div onClick={onCode} className="item redeemCode">
						<Label text={translate('popupSettingsMembershipRedeemCode')} />
						<Icon className="arrow" />
					</div>
				</div>
			) : ''}

			<div className="actionItems">
				{links.map((item, i) => (
					<div key={i} onClick={() => onLink(item)} className="item">
						<Label text={item.name} />
						<Icon />
					</div>
				))}
			</div>

			<Label className="special" text={translate('popupSettingsMembershipSpecial')} onClick={onContact} />
		</>
	);

}));

export default PageMainSettingsMembership;