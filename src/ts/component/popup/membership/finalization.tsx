import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Input, Loader } from 'Component';
import { I, C, S, U, J, translate } from 'Lib';

interface State {
	status: string,
	statusText: string,
	isLoading: boolean,
};

const PopupMembershipFinalization = observer(class PopupMembershipFinalization extends React.Component<I.Popup, State> {

	state = {
		status: '',
		statusText: '',
		isLoading: false,
	};

	refName: any = null;
	refButton: any = null;
	timeout: any = null;

	constructor (props: I.Popup) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onConfirm = this.onConfirm.bind(this);
	};

	render () {
		const { status, statusText, isLoading } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const tierItem = U.Data.getMembershipTier(tier);

		if (!tierItem) {
			return null;
		};

		const { membership } = S.Auth;
		const { period, periodType } = tierItem;
		const { name, nameType } = membership;
		
		let labelText = translate('popupMembershipPaidTextUnlimited');

		// default is year
		let periodLabel = translate('pluralYear');
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
				// one {day, week, month, year}
				labelText = U.Common.sprintf(translate('popupMembershipPaidTextPerGenericSingle'), U.Common.plural(period, periodLabel));
			} else {
				// N {days, weeks, months, years}
				labelText = U.Common.sprintf(translate('popupMembershipPaidTextPerGenericMany'), period, U.Common.plural(period, periodLabel));
			};
		};

		return (
			<div className="anyNameForm">
				<Title text={translate(`popupMembershipPaidTitle`)} />
				<Label text={labelText} />

				<div className="inputWrapper">
					<Input
						ref={ref => this.refName = ref}
						value={name}
						onKeyUp={this.onKeyUp}
						readonly={!!name}
						className={name ? 'disabled' : ''}
						placeholder={translate(`popupMembershipPaidPlaceholder`)}
					/>
					<div className="ns">{J.Constant.namespace[nameType]}</div>
				</div>

				<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>
				<Button ref={ref => this.refButton = ref} onClick={this.onConfirm} text={translate('commonConfirm')} />
				{isLoading ? <Loader /> : ''}
			</div>
		);
	};

	componentDidMount () {
		const name = this.getName();
		if (!name) {
			this.refButton.setDisabled(true);
		};
	};

	onKeyUp () {
		const { param } = this.props;
		const { data } = param;
		const { tier } = data;
		const name = this.refName.getValue();

		this.refButton.setDisabled(true);
		this.setState({ statusText: '', status: '' });

		window.clearTimeout(this.timeout);

		if (!name.length) {
			return;
		};

		this.timeout = window.setTimeout(() => {
			C.MembershipIsNameValid(tier, name, (message: any) => {
				if (message.error.code) {
					this.setError(message.error.description);
					return;
				};

				this.setState({ statusText: translate('popupMembershipStatusWaitASecond') });

				C.NameServiceResolveName(name, (message: any) => {
					let error = '';
					if (message.error.code) {
						error = message.error.description;
					} else
					if (!message.available) {
						error = translate('popupMembershipStatusNameNotAvailable');
					};

					if (error) {
						this.setError(error);
					} else {
						this.refButton.setDisabled(false);
						this.setOk(translate('popupMembershipStatusNameAvailable'));
					};
				});
			});
		}, J.Constant.delay.keyboard);
	};

	onConfirm () {
		const name = this.refName.getValue();

		this.setState({ isLoading: true });
		this.refButton.setDisabled(true);

		C.MembershipFinalize(name, (message) => {
			if (message.error.code) {
				this.setError(message.error.description);
				return;
			};

			U.Data.getMembershipTiers(true);
			U.Data.getMembershipStatus((membership) => {
				if (!membership || membership.isNone) {
					this.setError(translate('pageMainMembershipError'));
					return;
				};

				S.Popup.replace('membershipFinalization', 'membership', { data: { tier: membership.tier, success: true } });
			});
		});
	};

	getName () {
		return String(S.Auth.membership?.name || '');
	};

	setOk (t: string) {
		this.setState({ status: I.InterfaceStatus.Ok, statusText: t });
	};

	setError (t: string) {
		this.setState({ status: I.InterfaceStatus.Error, statusText: t });
	};

});

export default PopupMembershipFinalization;
