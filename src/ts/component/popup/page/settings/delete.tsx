import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Checkbox } from 'Component';
import { I, C, translate, Util, analytics } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';

import Head from './head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
};

const PopupSettingsPageDelete = observer(class PopupSettingsPageDelete extends React.Component<Props> {

	refCheckbox: any = null;
	node: any = null;

	constructor (props: Props) {
		super(props);

		this.onDelete = this.onDelete.bind(this);
		this.onCheck = this.onCheck.bind(this);
	};

	render () {
		return (
			<div
				ref={node => this.node = node}
			>
				<Head {...this.props} returnTo="account" name={translate('commonCancel')} />
				<Title text={translate('popupSettingsAccountDeleteTitle')} />

				<div className="text">
					<b>We&apos;re sorry to see you go. Once you request your account to be deleted, you have 30 days to cancel this request.</b>
					<p>You will be logged out on all other devices. You will have 30 days to recover it. Afterwards it will be deleted permanently</p>

					<div className="check" onClick={this.onCheck}>
						<Checkbox ref={ref => { this.refCheckbox = ref; }} /> I have read it and want to delete my account
					</div>
				</div>

				<div className="rows">
					<div id="row-delete" className="row disabled" onClick={this.onDelete}>
						<Label text={translate('commonDelete')} />
					</div>
				</div>
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
		const row = node.find('#row-delete');
		const value = this.refCheckbox.getValue();

		row.removeClass('red disabled');

		this.refCheckbox.setValue(!value);
		!value ? row.addClass('red') : row.addClass('disabled');
	};

});

export default PopupSettingsPageDelete;