import * as React from 'react';
import { Title, Button, Input, Label, Icon, Error } from 'Component';
import { I, C, translate, analytics } from 'Lib';
import { commonStore } from 'Store';
import Head from '../head';

interface State {
	error: string;
};

class PopupSettingsPageImportNotion extends React.Component<I.PopupSettings, State> {

	ref = null;
	state: State = {
		error: '',
	};

	constructor (props: I.PopupSettings) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		const { onPage } = this.props;
		const { error } = this.state;

		return (
			<React.Fragment>
				<Head {...this.props} returnTo="importIndex" name={translate('commonBack')} />

				<Icon className="logo" />
				<Title text="Notion" />
				<Label className="description" text={translate('popupPageSettingsImportNotionDescription')} />

				<div className="inputWrapper flex">
					<div className="errorWrapper">
						<Input 
							focusOnMount
							ref={(ref: any) => { this.ref = ref; }} 
							type="password"
							placeholder={translate('popupPageSettingsImportNotionTokenPlaceholder')}
						/>
						{error ? <Error text={error} /> : ''}
					</div>
					<Button text={translate('popupSettingsImportOk')} className="c36" onClick={this.onImport} />
				</div>

				<div className="line" />

				<div className="helpWrapper flex">
					<Title text={translate('popupPageSettingsImportNotionHowTo')} />
					<div className="btn" onClick={() => { onPage('importNotionHelp'); }}>
						<Icon className="help" />{translate('popupPageSettingsImportNotionLearnMore')}
					</div>
				</div>

				<ol className="list">
					<li>
						<Label text={translate('popupPageSettingsImportNotionIntegrationList11')} />
						<Label className="grey" text={translate('popupPageSettingsImportNotionIntegrationList12')} />
					</li>
					<li>
						<Label text={translate('popupPageSettingsImportNotionIntegrationList21')} />
						<Label className="grey" text={translate('popupPageSettingsImportNotionIntegrationList22')} />
					</li>
				</ol>
			</React.Fragment>
		);
	};
	
	onImport (): void {
		const token = this.ref.getValue();

		commonStore.notionTokenSet(token);

		analytics.event('ClickImport', { type: I.ImportType.Notion });

		C.ObjectImportNotionValidateToken(token, (message: any) => {
			if (message.error.code) {
				this.ref.setError(true);
				this.setState({ error: message.error.description });
				return;
			};

			this.props.onPage('importNotionWarning');
		});
	};

};

export default PopupSettingsPageImportNotion;
