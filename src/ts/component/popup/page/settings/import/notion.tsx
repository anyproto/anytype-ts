import * as React from 'react';
import { Title, Button, Input, Label, Icon, Error } from 'Component';
import { I, C, translate } from 'Lib';
import { commonStore } from 'Store';
import Head from '../head';

interface Props extends I.Popup {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (type: I.ImportType, param: any, callBack?: (message: any) => void) => void;
};

interface State {
	error: string;
};

class PopupSettingsPageImportNotion extends React.Component<Props, State> {

	ref: any = null;
	state: State = {
		error: '',
	};

	constructor (props: Props) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		const { onPage } = this.props;
		const { error } = this.state;

		return (
			<React.Fragment>
				<Head {...this.props} returnTo="importIndex" name={translate('commonBack')} />

				<Title text="Notion" />
				<Label className="description" text="Import your Notion files through the Notion API with 2 simple steps" />

				<div className="inputWrapper flex">
					<div className="errorWrapper">
						<Input 
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

	componentDidMount(): void {
		this.ref.focus();
	};

	onImport (): void {
		const token = this.ref.getValue();

		commonStore.notionTokenSet(token);

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