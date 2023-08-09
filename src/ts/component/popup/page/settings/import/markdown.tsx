import * as React from 'react';
import { Title, Label, Button, Icon } from 'Component';
import { I, UtilCommon, translate, analytics } from 'Lib';
import Head from '../head';

class PopupSettingsPageImportMarkdown extends React.Component<I.PopupSettings> {

	constructor (props: I.PopupSettings) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		return (
			<div>
				<Head {...this.props} returnTo="importIndex" name={translate('popupSettingsImportTitle')} />

				<Icon className="logo" />
				<Title text={translate('popupSettingsImportMarkdownTitle')} />

				<div className="path">
					<b>{translate('popupSettingsImportNotionExample')}</b>

					<ul>
						<li>{translate('popupSettingsImportNotionExampleStep1')}</li>
						<li>{translate('popupSettingsImportNotionExampleStep2')}</li>
						<li>{translate('popupSettingsImportNotionExampleStep3')}</li>
					</ul>
				</div>

				<Label text={translate('popupSettingsImportNotionExampleComplete')} />
				
				<div className="buttons">
					<Button className="c36" text={translate('popupSettingsImportOk')} onClick={this.onImport} />
				</div>
			</div>
		);
	};

	onImport () {
		const { close, onImport } = this.props;
		const options: any = { 
			properties: [ 'openFile' ],
			filters: [
				{ name: 'ZIP & MD', extensions: [ 'zip', 'md' ] }
			]
		};

		if (UtilCommon.isPlatformMac()) {
			options.properties.push('openDirectory');
		};

		analytics.event('ClickImport', { type: I.ImportType.Markdown });

		window.Electron.showOpenDialog(options).then((result: any) => {
			const paths = result.filePaths;
			if ((paths == undefined) || !paths.length) {
				return;
			};

			close();
			onImport(I.ImportType.Markdown, { paths });
		});
	};

};

export default PopupSettingsPageImportMarkdown;