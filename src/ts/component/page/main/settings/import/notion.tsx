import * as React from 'react';
import { Title, Button, Input, Label, Icon, Error } from 'Component';
import { I, C, S, U, J, translate, analytics } from 'Lib';

interface State {
	error: string;
};

class PageMainSettingsImportNotion extends React.Component<I.PageSettingsComponent, State> {

	ref = null;
	state: State = {
		error: '',
	};

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		const { onPage } = this.props;
		const { error } = this.state;

		return (
			<>
				<Icon className="logo" />
				<Title text="Notion" />
				<Label className="description" text={translate('popupSettingsImportNotionDescription')} />

				<div className="inputWrapper flex">
					<div className="errorWrapper">
						<Input 
							focusOnMount
							ref={ref => this.ref = ref}
							type="password"
							placeholder={translate('popupSettingsImportNotionTokenPlaceholder')}
						/>
						{error ? <Error text={error} /> : ''}
					</div>
					<Button text={translate('popupSettingsImportOk')} className="c36" onClick={this.onImport} />
				</div>

				<div className="line" />

				<div className="helpWrapper flex">
					<Title text={U.Common.sprintf(translate('popupSettingsImportNotionHowTo'), J.Url.notionFAQ)} />
					<div className="btn" onClick={() => onPage('importNotionHelp')}>
						<Icon className="help" />{translate('popupSettingsImportNotionStepByStepGuide')}
					</div>
				</div>

				<ol className="list">
					<li>
						<Label text={translate('popupSettingsImportNotionIntegrationList11')} />
						<Label className="grey" text={translate('popupSettingsImportNotionIntegrationList12')} />
					</li>
					<li>
						<Label text={translate('popupSettingsImportNotionIntegrationList21')} />
						<Label className="grey" text={translate('popupSettingsImportNotionIntegrationList22')} />
					</li>
					<li>
						<Label text={translate('popupSettingsImportNotionIntegrationList31')} />
						<Label className="grey" text={translate('popupSettingsImportNotionIntegrationList32')} />
					</li>
				</ol>
			</>
		);
	};
	
	onImport (): void {
		const token = this.ref.getValue();

		S.Common.notionTokenSet(token);

		analytics.event('ClickImport', { type: I.ImportType.Notion });

		C.ObjectImportNotionValidateToken(token, (message: any) => {
			if (message.error.code) {
				this.ref?.setError(true);
				this.setState({ error: message.error.description });
				return;
			};

			this.props.onPage('importNotionWarning');
		});
	};

};

export default PageMainSettingsImportNotion;
