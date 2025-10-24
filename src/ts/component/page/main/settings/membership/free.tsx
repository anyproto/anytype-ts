import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon, Switch } from 'Component';
import { I, S, U, J, C, Action, translate, analytics, keyboard } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Mousewheel } from 'swiper/modules';

const PageMainSettingsMembershipFree = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { membership } = S.Auth;
	const { interfaceLang } = S.Common;
	const { status } = membership;
	const [ showAnnual, setShowAnnual ] = useState(true);
	const tier = U.Data.getMembershipTier(membership.tier);
	const membershipTiers = S.Common.membershipTiers.filter(it => !it.isTest);

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
		{ url: J.Url.pricing, name: translate('popupSettingsMembershipFAQ'), type: 'MenuHelpMembershipFAQ' },
		{ url: J.Url.terms, name: translate('popupSettingsMembershipTermsAndConditions'), type: 'MenuHelpTerms' },
		{ url: J.Url.privacy, name: translate('popupSettingsMembershipPrivacyPolicy'), type: 'MenuHelpPrivacy' },
	];

	const actions = [
		{ id: 'activation', button: translate('commonActivate'), title: translate('popupSettingsMembershipActionsActivationTitle'), text: translate('popupSettingsMembershipActionsActivationText') },
		{ id: 'contact', button: translate('popupSettingsMembershipActionsContactReachUs'), title: translate('popupSettingsMembershipActionsContactTitle'), text: translate('popupSettingsMembershipActionsContactText') }
	];

	const onAction = (item: any) => {
		switch (item.id) {
			case 'activation': {
				onCode();
				break;
			};
			case 'contact': {
				onContact();
				break;
			};
		};
	};

	const onPay = (item: I.MembershipTier) => {
		C.MembershipGetPortalLinkUrl((message: any) => {
			if (message.url) {
				Action.openUrl(message.url);
			};
		});
	};

	const TierItem = (props: any) => {
		const { item } = props;
		const isCurrent = item.id == membership.tier;
		const periodPrice = showAnnual ? item.price : item.priceMonthly;
		const price = item.price ? `$${periodPrice}` : translate('popupSettingsMembershipJustEmail');
		const cn = [ 'tier', `c${item.id}`, item.color ];

		if (isCurrent) {
			cn.push('isCurrent');
		};

		let period = '';

		if (isCurrent) {
			if (membership.status == I.MembershipStatus.Pending) {
				period = translate('popupSettingsMembershipPending');
			} else
			if (item.period && membership.dateEnds) {
				period = U.Common.sprintf(translate('popupSettingsMembershipValidUntil'), U.Date.date('d M Y', membership.dateEnds));
			} else {
				period = translate('popupSettingsMembershipForeverFree');
			};
		} else
		if (item.period) {
			const periodLabel = showAnnual ? translate('pluralYear') : translate('pluralMonth');

			if (item.period == 1) {
				period = U.Common.sprintf(translate('popupSettingsMembershipPerGenericSingle'), U.Common.plural(item.period, periodLabel));
			} else {
				period = U.Common.sprintf(translate('popupSettingsMembershipPerGenericMany'), item.period, U.Common.plural(item.period, periodLabel));
			};
		};

		return (
			<div className={cn.join(' ')}>
				<div className="top">
					<div className="iconWrapper">
						<Icon />
					</div>

					<Title text={item.name} />

					<div className="features">
						{item.features.map((el, idx) => <Label key={idx} text={el} />)}
					</div>
				</div>
				<div className="bottom">
					<div className="priceWrapper">
						<span className="price">{price}</span>{period}
					</div>
					{isCurrent ? (
						<Button
							className="disabled"
							text={translate('popupSettingsMembershipCurrentPlan')}
						/>
					) : (
						<Button
							onClick={() => onPay(item)}
							color="accent"
							text={translate('popupSettingsMembershipSelectPlan')}
						/>
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="membershipFree">
			<Label text={translate('popupSettingsMembershipText')} />

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

			<div className="actions">
				{actions.map((item, idx) => (
					<div key={idx} className="action">
						<Icon className={item.id} />
						<Title text={item.title} />
						<Label text={item.text} />
						<Button text={item.button} color="blank" onClick={() => onAction(item)} />
					</div>
				))}
			</div>

			<div className="links">
				{links.map((item, i) => <Label key={i} onClick={() => onLink(item)} text={item.name} />)}
			</div>
		</div>
	);

}));

export default PageMainSettingsMembershipFree;
