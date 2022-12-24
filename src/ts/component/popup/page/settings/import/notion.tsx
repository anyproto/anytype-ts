import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Button, Input, Label, Icon } from 'Component';
import { I, translate } from 'Lib';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (type: I.ImportType, param: any, callBack?: (message: any) => void) => void;
};

class PopupSettingsPageImportNotion extends React.Component<Props, object> {

	ref: any = null;

	constructor (props: Props) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		const { onPage } = this.props;

		return (
			<div>
				<Head {...this.props} returnTo="importIndex" name={translate('popupSettingsImportTitle')} />
				<Title text="Notion" />
				<Label className="center" text="Import your Notion files through the Notion API with 2 simple steps" />

				<div className="inputWrapper flex">
					<Input 
						ref={(ref: any) => { this.ref = ref; }} 
						placeholder="Paste your integration token"
					/>
					<Button text={translate('popupSettingsImportOk')} onClick={this.onImport} />
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
						<Label className="grey" text="Settings & members -> My connections -> Develop or manage integrations -> New integration" />
					</li>
					<li>
						<Label text="Select the pages you want to import by adding the integration you created" />
						<Label className="grey" text="Select document -> ... -> Add Connections -> Confirm Integration" />
					</li>
				</ol>
			</div>
		);
	};

	componentDidMount(): void {
		this.ref.focus();
	};

	onImport (): void {
		const { close, onImport } = this.props;

		close();
		onImport(I.ImportType.Notion, { apiKey: this.ref.getValue() }, (message: any) => {
			if (message.error.code) {
				this.ref.setError(message.error.description);
			};
		});
	};

};

export default PopupSettingsPageImportNotion;