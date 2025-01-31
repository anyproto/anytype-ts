import * as React from 'react';
import { Title, Button, Checkbox, Error } from 'Component';
import { I, C, S, U, translate, analytics } from 'Lib';
import { observer } from 'mobx-react';
import Head from './head';

interface State {
	error: string;
};

const PopupSettingsPageDelete = observer(class PopupSettingsPageDelete extends React.Component<I.PopupSettings, State> {

	refCheckbox: any = null;
	refButton = null;
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
			<div ref={node => this.node = node}>
				<Head {...this.props} returnTo="dataIndex" name={translate('commonBack')} />
				<Title text={translate('popupSettingsAccountDeleteTitle')} />

				<div className="text">
					<b>{translate('popupSettingsDeleteTitle1')}</b>
					<p className="first">{translate('popupSettingsDeleteText1')}</p>

					<b>{translate('popupSettingsDeleteTitle2')}</b>
					<p>{translate('popupSettingsDeleteText2')}</p>
				</div>

				<div className="check" onClick={this.onCheck}>
					<Checkbox ref={ref => this.refCheckbox = ref} value={false} /> {translate('popupSettingsDeleteCheckboxLabel')}
				</div>

				<Button ref={ref => this.refButton = ref} text={translate('commonDelete')} color="red" className="c36" onClick={this.onDelete} />
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

			S.Auth.accountSetStatus(message.status);
			S.Menu.closeAllForced();

			this.props.close();

			U.Router.go('/auth/deleted', { replace: true });
			analytics.event('DeleteAccount');
		});
	};

	onCheck () {
		this.refCheckbox.toggle();
	};

});

export default PopupSettingsPageDelete;