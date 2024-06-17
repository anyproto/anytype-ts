import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Input, Loader } from 'Component';
import { C, I, translate, UtilData, UtilCommon } from 'Lib';
import { authStore, popupStore } from 'Store';
const Constant = require('json/constant.json');

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
		const tierItem = UtilData.getMembershipTier(tier);

		if (!tierItem) {
			return null;
		};

		const { membership } = authStore;
		const { period } = tierItem;
		const { name, nameType } = membership;

		let labelText = '';
		if (period) {
			if (period == 1) {
				labelText = translate('popupMembershipPaidTextPerYear');
			} else {
				labelText = UtilCommon.sprintf(translate('popupMembershipPaidTextPerYears'), period, UtilCommon.plural(period, translate('pluralYear')));
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
					<div className="ns">{Constant.namespace[nameType]}</div>
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
		}, Constant.delay.keyboard);
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

			UtilData.getMembershipTiers(true);
			UtilData.getMembershipStatus((membership) => {
				if (!membership || membership.isNone) {
					this.setError(translate('pageMainMembershipError'));
					return;
				};

				popupStore.replace('membershipFinalization', 'membership', { data: { tier: membership.tier, success: true } });
			});
		});
	};

	getName () {
		return String(authStore.membership?.name || '');
	};

	setOk (t: string) {
		this.setState({ status: I.InterfaceStatus.Ok, statusText: t });
	};

	setError (t: string) {
		this.setState({ status: I.InterfaceStatus.Error, statusText: t });
	};

});

export default PopupMembershipFinalization;
