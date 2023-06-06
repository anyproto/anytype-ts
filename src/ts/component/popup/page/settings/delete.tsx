import * as React from 'react';
import { Title, Button, Checkbox } from 'Component';
import { I, C, translate, Util, analytics } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';
import Head from './head';

const PopupSettingsPageDelete = observer(class PopupSettingsPageDelete extends React.Component<I.PopupSettings> {

	refCheckbox: any = null;
	node: any = null;

	constructor (props: I.PopupSettings) {
		super(props);

		this.onDelete = this.onDelete.bind(this);
		this.onCheck = this.onCheck.bind(this);
	};

	render () {
		return (
			<div
				ref={node => this.node = node}
			>
				<Head {...this.props} returnTo="account" name={translate('commonBack')} />
				<Title text={translate('popupSettingsAccountDeleteTitle')} />

				<div className="text">
					<b>1. You have 30 days to cancel account deletion</b>
					<p className="first">We&apos;re sorry to see you go. Once you request your account to be deleted, you have 30 days to cancel this request. After 30 days, your account data is permanently removed from the backup node, you won't be able to sign into Anytype on new devices.</p>

					<b>2. Delete data from other devices</b>
					<p>Since Anytype stores all your data locally on the device, you need to remove it from other devices also. Launch and remove data in Anytype or just delete the app.</p>
				</div>

				<div className="check" onClick={this.onCheck}>
					<Checkbox ref={ref => this.refCheckbox = ref} /> I have read it and want to delete my account
				</div>

				<Button id="button" text={translate('commonDelete')} color="red c36" className="disabled" onClick={this.onDelete} />
			</div>
		);
	};

	onDelete (e: any) {
		const check = this.refCheckbox.getValue();
		if (!check) {
			return;
		};

		C.AccountDelete(false, (message: any) => {
			if (message.error.code) {
				return;
			};

			authStore.accountSet({ status: message.status });		
			this.props.close();
			Util.route('/auth/deleted');

			analytics.event('DeleteAccount');
		});
	};

	onCheck () {
		const node = $(this.node);
		const button = node.find('#button');
		const value = !this.refCheckbox.getValue();

		this.refCheckbox.setValue(value);
		value ? button.removeClass('disabled') : button.addClass('disabled');
	};

});

export default PopupSettingsPageDelete;