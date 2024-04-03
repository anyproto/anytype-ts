import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Input } from 'Component';
import { I, translate } from 'Lib';
import { authStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	status: string,
	statusText: string
};

const PopupMembershipFinalization = observer(class PopupMembershipFinalization extends React.Component<I.Popup, State> {

	state = {
		status: '',
		statusText: '',
	};

	refName: any = null;
	timeout: any = null;

	constructor (props: I.Popup) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
	};

	render () {
		const { status, statusText } = this.state;
		const globalName = this.getName();

		return (
			<React.Fragment>
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

				<Button onClick={this.onConfirm} text={translate('commonConfirm')} />
			</React.Fragment>
		);
	};

	onKeyUp () {

	};

	onConfirm () {

	};

	getName () {
		return String(authStore.membership?.requestedAnyName || '');
	};

});

export default PopupMembershipFinalization;
