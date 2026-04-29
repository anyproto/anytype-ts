import React, { forwardRef, useState, useRef, useImperativeHandle } from 'react';
import { Title, Label, Button, Icon } from 'Component';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Mousewheel } from 'swiper/modules';
import * as I from 'Interface';

const PageMainSettingsMembershipIntro = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const [ period, setPeriod ] = useState<I.MembershipPeriod>(I.MembershipPeriod.Yearly);

	const { data } = S.Membership;
	const current = data?.getTopProduct();
	const purchased = data?.getTopPurchasedProduct();
	const rest = S.Membership.products.filter(it => it.isTopLevel && !it.isHidden && !it.isIntro&& it.id !== purchased?.product?.id);
	const products = [ ...rest ];

	if (current) {
		products.unshift(current);
	};

	const hasLifetime = products.some(it => (it.pricesLifetime || []).length > 0);
	const periodOptions = [
		{ id: I.MembershipPeriod.Monthly, key: 'isMonthly', analyticsType: 'Monthly', label: translate('popupSettingsMembershipSwitchMonthly') },
		{ id: I.MembershipPeriod.Yearly, key: 'isAnnual', analyticsType: 'Annual', label: translate('popupSettingsMembershipSwitchAnnual') },
		hasLifetime ? { id: I.MembershipPeriod.Lifetime, key: 'isLifetime', analyticsType: 'Lifetime', label: translate('popupSettingsMembershipSwitchLifetime') } : null,
	].filter(it => it);
	const activeOption = periodOptions.find(it => it.id == period) || periodOptions[1];

	const onSwitch = (option: typeof periodOptions[number]) => {
		if (option.id == period) {
			return;
		};

		setPeriod(option.id);
		analytics.event('ScreenMembershipSwitchPeriod', { type: option.analyticsType });
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
		{ id: 'activation', icon: 'popup/header/activation', button: translate('commonActivate'), title: translate('popupSettingsMembershipActionsActivationTitle'), text: translate('popupSettingsMembershipActionsActivationText') },
		{ id: 'contact', icon: 'membership/contact', button: translate('popupSettingsMembershipActionsContactReachUs'), title: translate('popupSettingsMembershipActionsContactTitle'), text: translate('popupSettingsMembershipActionsContactText') }
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

	const onPay = (item: any, callBack: () => void) => {
		const isYearly = period == I.MembershipPeriod.Yearly;
		const isLifetime = period == I.MembershipPeriod.Lifetime;

		C.MembershipV2CartUpdate([ item.id ], isYearly, isLifetime, (res) => {
			if (res.error.code) {
				callBack();
				return;
			};

			C.MembershipV2GetPortalLink((message) => {
				if (message.url) {
					Action.openUrl(message.url);
				};

				callBack();
			});
		});
		analytics.event('ClickMembership', { name: item.name });
	};

	const TierItem = (props: any) => {
		const { item } = props;
		const isCurrent = (item.id == current?.id) || (item.isIntro && !current);
		const price = item.getPriceString(period);
		const cn = [ 'tier', `c${item.id}`, item.colorStr ];
		const buttonRef = useRef(null);

		if (isCurrent) {
			cn.push('isCurrent');
		};

		let periodLabel = '';

		if (isCurrent) {
			if (purchased?.isPending) {
				periodLabel = translate('popupSettingsMembershipPending');
			} else
			if (item.period && purchased?.info.dateEnds) {
				periodLabel = U.String.sprintf(translate('popupSettingsMembershipValidUntil'), U.Date.date('d M Y', purchased?.info.dateEnds));
			} else {
				periodLabel = translate('popupSettingsMembershipForeverFree');
			};
		} else {
			let periodName = '';

			switch (period) {
				case I.MembershipPeriod.Monthly: periodName = U.Common.plural(1, translate('pluralMonth')); break;
				case I.MembershipPeriod.Yearly: periodName = U.Common.plural(1, translate('pluralYear')); break;
				case I.MembershipPeriod.Lifetime: periodName = translate('membershipPeriod4'); break;
			};

			periodLabel = U.String.sprintf(translate('popupSettingsMembershipCurrentPricePeriod'), periodName);
		};

		const onClick = () => {
			buttonRef.current?.setLoading(true);
			onPay(item, () => buttonRef.current?.setLoading(false));
		};

		return (
			<div className={cn.join(' ')}>
				<div className="top">
					<div className="iconWrapper">
						<Icon name={item.iconName} size={64} />
					</div>

					<Title text={item.name} />

					<div className="features">
						{item.featuresList.map(({ key, value }) => {
							const name = translate(U.String.toCamelCase(`membershipFeature-${key}`));

							if (key == 'storageBytes') {
								value = U.File.size(value);
							} else 
							if (value >= 4096) {
								value = translate('commonUnlimited');
							};

							return (
								<div key={key} className="label">
									<Icon name="membership/tick" size={14} />
									<span dangerouslySetInnerHTML={{ __html: U.String.sanitize(U.String.sprintf(name, value)) }} />
								</div>
							);
						})}
					</div>
				</div>
				<div className="bottom">
					{!isCurrent ? (
						<div className="priceWrapper">
							<span className="price">{price}</span>{periodLabel}
						</div>
					) : ''}
					{isCurrent ? (
						<Button
							className="disabled"
							text={translate('popupSettingsMembershipCurrentPlan')}
						/>
					) : (
						<Button
							ref={buttonRef}
							onClick={onClick}
							color="accent"
							text={translate('popupSettingsMembershipSelectPlan')}
						/>
					)}
				</div>
			</div>
		);
	};

	const resize = () => {
		const { ww } = U.Dom.getWindowDimensions();
		const sw = sidebar.getDummyWidth();
		const pw = ww - sw;
		const breakpoint = {
			normal: 1040,
			narrow: 796,
			tiny: 552,
		};

		for (const key of Object.keys(breakpoint)) {
			U.Dom.toggleClass(nodeRef.current, key, pw <= breakpoint[key]);
		};
	};

	useImperativeHandle(ref, () => ({
		resize,
	}));

	const switchCn = [ 'switchWrapper', activeOption.key, `c${periodOptions.length}` ];

	return (
		<div ref={nodeRef} className="membershipIntro">
			<div className="content">
				<Label text={translate('popupSettingsMembershipText')} />

				<div className={switchCn.join(' ')}>
					{periodOptions.map(option => (
						<Label
							key={option.id}
							className={period == option.id ? 'active' : ''}
							text={option.label}
							onClick={() => onSwitch(option)}
						/>
					))}
				</div>

				<div className="tiers">
					<Swiper
						slidesPerView={'auto'}
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
								<Icon name={item.icon} className={item.id} size={28} />
								<Title text={item.title} />
								<Label text={item.text} />
							</div>
							<Button text={item.button} color="blank" onClick={() => onAction(item)} />
						</div>
					))}
				</div>
			</div>

			<div className="links">
				{links.map((item, i) => <Label key={i} onClick={() => onLink(item)} text={item.name} />)}
			</div>
		</div>
	);

});

export default PageMainSettingsMembershipIntro;