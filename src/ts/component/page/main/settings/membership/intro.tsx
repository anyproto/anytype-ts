import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon } from 'Component';
import { I, S, U, J, C, Action, translate, analytics, keyboard } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Mousewheel } from 'swiper/modules';

const PageMainSettingsMembershipIntro = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const [ isAnnual, setIsAnnual ] = useState(true);
	const products = S.Membership.products.filter(it => it.isTopLevel && !it.isHidden);
	const { data } = S.Membership;
	const current = data?.getTopProduct();

	const onSwitch = () => {
		setIsAnnual(!isAnnual);
		analytics.event('ScreenMembershipSwitchPeriod', { type: isAnnual ? 'Monthly' : 'Annual' });
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

	const onPay = (item: any) => {
		C.MembershipV2CartUpdate([ item.id ], isAnnual, (res) => {
			if (res.error.code) {
				console.log('ERROR WHILE CART UPDATE')
				return;
			};

			C.MembershipV2GetPortalLink((message) => {
				if (message.url) {
					Action.openUrl(message.url);
				};
			});
		});
		analytics.event('ClickMembership', { name: item.name });
	};

	const TierItem = (props: any) => {
		const { item } = props;
		const isCurrent = item.id == current?.product.id;
		const price = item.getPriceString(isAnnual);
		const cn = [ 'tier', `c${item.id}`, item.colorStr ];

		if (isCurrent) {
			cn.push('isCurrent');
		};

		let period = '';

		if (isCurrent) {
			if (current?.status == I.MembershipStatus.Pending) {
				period = translate('popupSettingsMembershipPending');
			} else
			if (item.period && current?.info.dateEnds) {
				period = U.Common.sprintf(translate('popupSettingsMembershipValidUntil'), U.Date.date('d M Y', current?.info.dateEnds));
			} else {
				period = translate('popupSettingsMembershipForeverFree');
			};
		} else {
			period = `per ${U.Common.plural(1, isAnnual ? translate('pluralYear') : translate('pluralMonth'))}`;
		};

		return (
			<div className={cn.join(' ')}>
				<div className="top">
					<div className="iconWrapper">
						<Icon />
					</div>

					<Title text={item.name} />

					<div className="features">
						{item.featuresList.map(el => {
							const name = translate(U.Common.toCamelCase(`membershipFeature-${el.key}`));

							let value = el.value;
							if (el.key == 'storageBytes') {
								value = U.File.size(el.value);
							};

							return <Label key={el.key} text={`${name}: ${value}`} />;
						})}
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
		<div className="membershipIntro">
			<Label text={translate('popupSettingsMembershipText')} />

			<div className={[ 'switchWrapper', isAnnual ? 'isAnnual' : 'isMonthly' ].join(' ')} onClick={onSwitch}>
				<Label className={!isAnnual ? 'active' : ''} text={translate('popupSettingsMembershipSwitchMonthly')} />
				<Label className={isAnnual ? 'active' : ''} text={translate('popupSettingsMembershipSwitchAnnual')} />
			</div>

			<div className="tiers">
				<Swiper
					slidesPerView={3}
					mousewheel={{ forceToAxis: true }}
					pagination={products.length > 3 ? { clickable: true } : false}
					modules={[ Pagination, Mousewheel ]}
				>
					{products.map((item) => (
						<SwiperSlide key={item.id}>
							<TierItem item={item} />
						</SwiperSlide>
					))}
				</Swiper>
			</div>

			<div className="actions">
				{actions.map((item, idx) => (
					<div key={idx} className="action">
						<div className="top">
							<Icon className={item.id} />
							<Title text={item.title} />
							<Label text={item.text} />
						</div>
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

export default PageMainSettingsMembershipIntro;
