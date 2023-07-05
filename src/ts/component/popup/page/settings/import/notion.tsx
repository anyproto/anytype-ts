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
				<Label className="description" text="Import your Notion files through the Notion API with 2 simple steps" />

				<div className="inputWrapper flex">
					<div className="errorWrapper">
						<Input 
							focusOnMount
							ref={(ref: any) => { this.ref = ref; }} 
							type="password"
							placeholder="Paste your integration token"
						/>
						{error ? <Error text={error} /> : ''}
					</div>
					<Button text={translate('popupSettingsImportOk')} className="c36" onClick={this.onImport} />
				</div>

				<div className="line" />

				<div className="helpWrapper flex">
					<Title text="How to import from Notion" />
					<div className="btn" onClick={() => { onPage('importNotionHelp'); }}>
						<Icon className="help" />Learn more
					</div>
				</div>

				<ol className="list">
					<li>
						<Label text="Create the integration you need to get Notion files" />
						<Label className="grey" text={`Settings &amp; members -> My connections -> Develop or manage integrations -> <a href="https://www.notion.so/my-integrations">New integration</a>`} />
					</li>
					<li>
						<Label text="Select the pages you want to import by adding the integration you created" />
						<Label className="grey" text="Select document -> ... -> Add Connections -> Confirm Integration" />
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