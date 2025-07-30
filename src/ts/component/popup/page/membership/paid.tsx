import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Input, Button, FooterAuthDisclaimer } from 'Component';
import { I, C, S, U, J, translate, analytics, Action } from 'Lib';

const PopupMembershipPagePaid = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param } = props;
	const [ status, setStatus ] = useState('');
	const [ statusText, setStatusText ] = useState('');

	const nameRef = useRef(null);
	const buttonCardRef = useRef(null);
	const buttonCryptoRef = useRef(null);
	const buttonActivateRef = useRef(null);
	const timeoutRef = useRef(null);

	const getName = () => {
		return nameRef.current?.getValue().trim() || '';
	};

	const getGlobalName = () => {
		return String(S.Auth.membership?.name || '');
	};

	const disableButtons = (v: boolean) => {
		buttonCardRef.current?.setDisabled(v);
		buttonCryptoRef.current?.setDisabled(v);
		buttonActivateRef.current?.setDisabled(v);
	};

	const setOk = (t: string) => {
		setStatus(I.InterfaceStatus.Ok);
		setStatusText(t);
	};

	const setError = (t: string) => {
		setStatus(I.InterfaceStatus.Error);
		setStatusText(t);
	};

	const checkName = (name: string, callBack: () => void) => {
		name = String(name || '').trim();
		if (!name.length) {
			return;
		};

		const { data } = param;
		const { tier } = data;

		C.MembershipIsNameValid(tier, name, (message: any) => {
			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			if (callBack) {
				callBack();
			};
		});
	};

	const validateName = (callBack?: () => void) => {
		const name = getName();
		const globalName = getGlobalName();

		if (!globalName.length) {
			checkName(name, () => {
				setStatusText(translate('popupMembershipStatusWaitASecond'));

				C.NameServiceResolveName(name, (message: any) => {
					let error = '';
					if (message.error.code) {
						error = message.error.description;
					} else
					if (!message.available) {
						error = translate('popupMembershipStatusNameNotAvailable');
					};

					if (error) {
						setError(error);
					} else {
						disableButtons(false);
						setOk(translate('popupMembershipStatusNameAvailable'));

						if (callBack) {
							callBack();
						};
					};
				});
			});
		} else {
			disableButtons(false);

			if (callBack) {
				callBack();
			};
		}
	};

	const onKeyUp = (e: any) => {
		disableButtons(true);
		setStatusText('');
		setStatus('');

		window.clearTimeout(timeoutRef.current);
		timeoutRef.current = window.setTimeout(() => validateName(), J.Constant.delay.keyboard);
	};

	const onSubmit = (e: any) => {
		e.preventDefault();

		if (status != I.InterfaceStatus.Error) {
			validateName(() => onPay(I.PaymentMethod.Stripe));
		};
	};

	const onPay = (method: I.PaymentMethod) => {
		const { data } = param;
		const { tier } = data;
		const globalName = getGlobalName();
		const tierItem = U.Data.getMembershipTier(tier);
		const name = globalName || !tierItem.namesCount ? '' : getName();
		const refButton = method == I.PaymentMethod.Stripe ? buttonCardRef.current : buttonCryptoRef.current;
		const cb = () => {
			C.MembershipRegisterPaymentRequest(tier, method, name, (message) => {
				refButton?.setLoading(false);

				if (message.error.code) {
					setError(message.error.description);
					return;
				};

				if (message.url) {
					Action.openUrl(message.url);
				};

				analytics.event('ClickMembership', { params: { tier, method }});
			});
		};

		refButton?.setLoading(true);
		tierItem.nameMinLength ? validateName(cb) : cb();
	};

	const onRedeemCode = () => {
		const { data } = param;
		const { code } = data;

		buttonActivateRef.current?.setLoading(true);

		C.MembershipCodeRedeem(code, getName(), (message) => {
			buttonActivateRef.current?.setLoading(false);

			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			U.Data.getMembershipTiers(true, () => {
				U.Data.getMembershipStatus((membership) => {
					if (!membership || membership.isNone) {
						setError(translate('pageMainMembershipError'));
						return;
					};

					S.Popup.replace('membershipFinalization', 'membership', { data: { tier: membership.tier, success: true } });
				});
			});
		});
	};

	useEffect(() => {
		const { data } = param;
		const { tier } = data;
		const tierItem = U.Data.getMembershipTier(tier);
		const globalName = getGlobalName();

		if (!globalName && tierItem.namesCount) {
			disableButtons(true);
		};

		return () => {
			if (timeoutRef.current) {
				window.clearTimeout(timeoutRef.current);
			};
		};
	}, []);

	const { data } = param;
	const { tier, code } = data;
	const tierItem = U.Data.getMembershipTier(tier);

	if (!tierItem) {
		return null;
	};

	const { period, periodType } = tierItem;
	const { membership } = S.Auth;
	const { name, nameType, paymentMethod } = membership;
	const canPayCrypto = (membership.status != I.MembershipStatus.Active) || membership.isStarter;

	let platformText = '';
	let withContactButton = false;
	let canEnterName = !name;

	if (membership.tier == I.TierType.Builder) {
		switch (paymentMethod) {
			case I.PaymentMethod.Apple:
			case I.PaymentMethod.Google: {
				platformText = translate('popupMembershipPaidOnOtherPlatform');
				canEnterName = false;
				break;
			};

			case I.PaymentMethod.Crypto: {
				platformText = translate('popupMembershipPaidByCrypto');
				withContactButton = true;
				canEnterName = false;
				break;
			};
		};
	};

	let labelText = translate('popupMembershipPaidTextUnlimited');

	let periodLabel = translate('pluralYear');
	let periodText = U.Common.sprintf(translate('popupSettingsMembershipPerGenericSingle'), U.Common.plural(period, periodLabel));

	if (periodType) {
		switch (periodType) {
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

	if (period) {
		if (period == 1) {
			periodText = U.Common.sprintf(translate('popupSettingsMembershipPerGenericSingle'), U.Common.plural(period, periodLabel));
			labelText = U.Common.sprintf(translate('popupMembershipPaidTextPerGenericSingle'), U.Common.plural(period, periodLabel));
		} else {
			periodText = U.Common.sprintf(translate('popupSettingsMembershipPerGenericMany'), period, U.Common.plural(period, periodLabel));
			labelText = U.Common.sprintf(translate('popupMembershipPaidTextPerGenericMany'), period, U.Common.plural(period, periodLabel));
		};
	};

	return (
		<>
			<form className="anyNameForm" onSubmit={onSubmit}>
				{tierItem.namesCount ? (
					<>
						<Title text={translate(`popupMembershipPaidTitle`)} />
						<Label text={labelText} />

						<div className="inputWrapper">
							<Input
								ref={nameRef}
								value={name}
								onKeyUp={onKeyUp}
								readonly={!canEnterName}
								className={!canEnterName ? 'disabled' : ''}
								placeholder={translate(`popupMembershipPaidPlaceholder`)}
							/>
							<div className="ns">{J.Constant.namespace[nameType]}</div>
						</div>
					</>
				) : ''}

				{code ? '' : (
					<div className="priceWrapper">
						{tierItem.price ? <span className="price">{`$${tierItem.price}`}</span> : ''}
						{periodText}
					</div>
				)}

				{platformText ? (
					<div className="platformLabel">
						<Label className="paidOnOtherPlatform" text={platformText} />
						{withContactButton ? <Button onClick={() => Action.membershipUpgradeViaEmail()} text={translate('popupMembershipWriteToAnyteam')} className="c36" color="blank" /> : ''}
					</div>
				) : (
					<div className="buttons">
						{code ? (
							<Button onClick={() => onRedeemCode()} ref={buttonActivateRef} className="c36" text={translate('popupMembershipActivate')} />
						) : (
							<>
								<Button onClick={() => onPay(I.PaymentMethod.Stripe)} ref={buttonCardRef} className="c36" text={translate('popupMembershipPayByCard')} />
								{canPayCrypto ? (
									<Button onClick={() => onPay(I.PaymentMethod.Crypto)} ref={buttonCryptoRef} className="c36" text={translate('popupMembershipPayByCrypto')} />
								) : ''}
							</>
						)}
					</div>
				)}

				<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>
			</form>

			<FooterAuthDisclaimer />
		</>
	);

}));

export default PopupMembershipPagePaid;