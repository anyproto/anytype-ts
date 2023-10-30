import * as React from 'react';
import { Title, Button, Checkbox, Error } from 'Component';
import { I, C, translate, UtilRouter, analytics } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';
import Head from './head';

interface State {
	error: string;
};

const PopupSettingsPageDelete = observer(class PopupSettingsPageDelete extends React.Component<I.PopupSettings, State> {

	refCheckbox: any = null;
	node: any = null;
	state = {
		error: '',
	};

	constructor (props: I.PopupSettings) {
		super(props);

		this.onDelete = this.onDelete.bind(this);
		this.onCheck = this.onCheck.bind(this);
	};

	render () {
		const { error } = this.state;

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

				<Error text={error} />
			</div>
		);
	};

	onDelete (e: any) {
		const check = this.refCheckbox.getValue();
		if (!check) {
			return;
		};

		C.AccountDelete((message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			authStore.accountSetStatus(message.status);	

			this.props.close();

			UtilRouter.go('/auth/deleted', { replace: true });
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
