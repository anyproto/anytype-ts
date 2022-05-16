import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Checkbox } from 'ts/component';
import { I, C, translate, Util } from 'ts/lib';
import { authStore } from 'ts/store';
import { observer } from 'mobx-react';

import Head from './head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
};

const PopupSettingsPageDelete = observer(class PopupSettingsPageDelete extends React.Component<Props, {}> {

	refCheckbox: any = null;

	constructor (props: any) {
		super(props);

		this.onDelete = this.onDelete.bind(this);
		this.onCheck = this.onCheck.bind(this);
	};

	render () {
		return (
			<div>
				<Head {...this.props} id="account" name={translate('commonCancel')} />
				<Title text={translate('popupSettingsAccountDeleteTitle')} />

				<div className="text">
					<b>1. We're sorry to see you go. Once you request your account to be deleted, you have 30 days to cancel this request.</b>
					<p>After 30 days, your objects are permanently removed from the Anytype backup node.</p>

					<b>2. You can continue to work as normal.</b>
					<p>All logged-in devices will continue to store data locally. However, you won't be able to sign into Anytype on new devices using your recovery phrase. </p>

					<div className="check" onClick={this.onCheck}>
						<Checkbox ref={(ref: any) => { this.refCheckbox = ref; }} /> I have read it and want to delete my account
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
			authStore.accountSet({ status: message.status });		
			this.props.close();
			Util.route('/auth/deleted');
		});
	};

	onCheck () {
		const node = $(ReactDOM.findDOMNode(this));
		const row = node.find('#row-delete');
		const value = this.refCheckbox.getValue();

		row.removeClass('red disabled');

		this.refCheckbox.setValue(!value);
		!value ? row.addClass('red') : row.addClass('disabled');
	};

});

export default PopupSettingsPageDelete;