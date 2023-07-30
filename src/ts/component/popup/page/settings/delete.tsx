import * as React from 'react';
import { Title, Button, Checkbox } from 'Component';
import { I, C, translate, UtilCommon, analytics } from 'Lib';
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
				<Head {...this.props} returnTo="dataManagement" name={translate('commonBack')} />
				<Title text={translate('popupSettingsAccountDeleteTitle')} />

				<div className="text">
					<b>{translate('popupSettingsDeleteTitle1')}</b>
					<p className="first">{translate('popupSettingsDeleteText1')}</p>

					<b>{translate('popupSettingsDeleteTitle2')}</b>
					<p>{translate('popupSettingsDeleteText2')}</p>
				</div>

				<div className="check" onClick={this.onCheck}>
					<Checkbox ref={ref => this.refCheckbox = ref} /> {translate('popupSettingsDeleteCheckboxLabel')}
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
			UtilCommon.route('/auth/deleted', { replace: true });

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
