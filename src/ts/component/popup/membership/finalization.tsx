import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Input, Loader } from 'Component';
import { C, I, translate, UtilData } from 'Lib';
import { authStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	status: string,
	statusText: string,
	loading: boolean,
};

const PopupMembershipFinalization = observer(class PopupMembershipFinalization extends React.Component<I.Popup, State> {

	state = {
		status: '',
		statusText: '',
		loading: false,
	};

	refName: any = null;
	refButton: any = null;
	timeout: any = null;

	constructor (props: I.Popup) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
	};

	render () {
		const { status, statusText, loading } = this.state;
		const globalName = this.getName();

		return (
			<div className="anyNameForm">
				<Title text={translate(`popupMembershipPaidTitle`)} />
				<Label text={translate(`popupMembershipPaidText`)} />

				<div className="inputWrapper">
					<Input
						ref={ref => this.refName = ref}
						value={globalName}
						onKeyUp={this.onKeyUp}
						readonly={!!globalName}
						className={globalName ? 'disabled' : ''}
						placeholder={translate(`popupMembershipPaidPlaceholder`)}
					/>
					{!globalName ? <div className="ns">{Constant.anyNameSpace}</div> : ''}
				</div>

				<div className={[ 'statusBar', status ].join(' ')}>{statusText}</div>

				<Button ref={ref => this.refButton = ref} onClick={this.onConfirm} text={translate('commonConfirm')} />

				{loading ? <Loader /> : ''}
			</div>
		);
	};

	componentDidMount () {
		const globalName = this.getName();
		if (!globalName) {
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
			C.MembershipIsNameValid(tier, name + Constant.anyNameSpace, (message: any) => {
				if (message.error.code) {
					this.setState({ status: 'error', statusText: translate(`popupMembershipCode${message.error.code}`) });
					return;
				};

				this.setState({ statusText: translate('popupMembershipStatusWaitASecond') });
				C.NameServiceResolveName(name + Constant.anyNameSpace, (message: any) => {
					let error = '';
					if (message.error.code) {
						error = message.error.description;
					} else
					if (!message.available) {
						error = translate('popupMembershipStatusNameNotAvailable');
					};

					if (error) {
						this.setState({ status: 'error', statusText: error });
					} else {
						this.refButton.setDisabled(false);
						this.setState({ status: 'ok', statusText: translate('popupMembershipStatusNameAvailable') });
					};
				});
			});
		}, Constant.delay.keyboard);
	};

	onConfirm () {
		const { close } = this.props;
		const name = this.refName.getValue();

		this.setState({ loading: true });
		this.refButton.setDisabled(true);

		C.MembershipFinalize(name, (message) => {
			if (message.error.code) {
				this.setState({ status: 'error', statusText: message.error.description });
				return;
			};

			UtilData.getMembershipTiers();
			UtilData.getMembershipData((membership) => {
				close();

				window.setTimeout(() => {
					popupStore.open('membership', { data: { tier: membership.tier, success: true } });
				}, popupStore.getTimeout());
			});
		});
	};

	getName () {
		return String(authStore.membership?.requestedAnyName || '');
	};

});

export default PopupMembershipFinalization;
