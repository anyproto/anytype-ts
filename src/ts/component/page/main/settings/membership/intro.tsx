import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { Title, Label, Button, Icon } from 'Component';
import { I, S, U, J, C, Action, translate, analytics, keyboard, sidebar } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Mousewheel } from 'swiper/modules';

const PageMainSettingsMembershipIntro = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const [ isAnnual, setIsAnnual ] = useState(true);
	
	const { data } = S.Membership;
	const current = data?.getTopProduct();
	const purchased = data?.getTopPurchasedProduct();
	const rest = S.Membership.products.filter(it => it.isTopLevel && !it.isHidden && !it.isIntro&& it.id !== purchased?.product?.id);
	const products = [ ...rest ];

	if (current) {
		products.unshift(current);
	};

	const rebind = () => {
		unbind();
		resize();
		$(window).on('resize.membershipIntro sidebarResize.membershipIntro', resize);
	};

	const unbind = () => {
		$(window).off('resize.membershipIntro sidebarResize.membershipIntro');
	};

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

	const onPay = (item: any, callBack: () => void) => {
		C.MembershipV2CartUpdate([ item.id ], isAnnual, (res) => {
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
		const price = item.getPriceString(isAnnual);
		const cn = [ 'tier', `c${item.id}`, item.colorStr ];
		const buttonRef = useRef(null);

		if (isCurrent) {
			cn.push('isCurrent');
		};

		let period = '';

		if (isCurrent) {
			if (purchased?.isPending) {
				period = translate('popupSettingsMembershipPending');
			} else
			if (item.period && purchased?.info.dateEnds) {
				period = U.String.sprintf(translate('popupSettingsMembershipValidUntil'), U.Date.date('d M Y', purchased?.info.dateEnds));
			} else {
				period = translate('popupSettingsMembershipForeverFree');
			};
		} else {
			const periodName = U.Common.plural(1, isAnnual ? translate('pluralYear') : translate('pluralMonth'));
			period = U.String.sprintf(translate('popupSettingsMembershipCurrentPricePeriod'), periodName);
		};

		const onClick = () => {
			buttonRef.current.setLoading(true);
			onPay(item, () => buttonRef.current.setLoading(false));
		};

		return (
			<div className={cn.join(' ')}>
				<div className="top">
					<div className="iconWrapper">
						<Icon />
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

							return <Label key={key} text={U.String.sprintf(name, value)} />;
						})}
					</div>
				</div>
				<div className="bottom">
					{!isCurrent ? (
						<div className="priceWrapper">
							<span className="price">{price}</span>{period}
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
		const { ww } = U.Common.getWindowDimensions();
		const sw = sidebar.getDummyWidth();
		const pw = ww - sw;
		const breakpoint = {
			normal: 1040,
			narrow: 796,
			tiny: 552,
		};

		for (const key of Object.keys(breakpoint)) {
			$(nodeRef.current).toggleClass(key, pw <= breakpoint[key]);
		};
	};

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	return (
		<div ref={nodeRef} className="membershipIntro">
			<div className="content">
				<Label text={translate('popupSettingsMembershipText')} />

				<div className={[ 'switchWrapper', isAnnual ? 'isAnnual' : 'isMonthly' ].join(' ')} onClick={onSwitch}>
					<Label className={!isAnnual ? 'active' : ''} text={translate('popupSettingsMembershipSwitchMonthly')} />
					<Label className={isAnnual ? 'active' : ''} text={translate('popupSettingsMembershipSwitchAnnual')} />
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
								<Icon className={item.id} />
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

}));

export default PageMainSettingsMembershipIntro;