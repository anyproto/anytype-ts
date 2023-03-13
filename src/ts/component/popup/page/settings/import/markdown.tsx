import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { IconObject, Title, Label, Button, Icon } from 'Component';
import { I, Util, translate } from 'Lib';
import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (type: I.ImportType, param: any, callBack?: (message: any) => void) => void;
};

class PopupSettingsPageImportMarkdown extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		return (
			<div>
				<Head {...this.props} returnTo="importIndex" name={translate('popupSettingsImportTitle')} />

				<Icon className="logo" />
				<Title text={translate('popupSettingsImportMarkdownTitle')} />
				<Label text={translate('popupSettingsImportFirst')} />

				<div className="path">
					<b>{translate('popupSettingsImportPageTitle')}</b>
					Three dots menu on the top-left corner → <IconObject object={{ iconEmoji: ':paperclip:' }} /> Export →  <br/> Export format : &quot;Markdown &amp; CSV&quot;.
				</div>

				<Label text={translate('popupSettingsImportZip')} />
				
				<div className="buttons">
					<Button className="c36" text={translate('popupSettingsImportOk')} onClick={this.onImport} />
				</div>

				<Label className="small" text={translate('popupSettingsImportWarning')} />
			</div>
		);
	};

	onImport () {
		const { close, onImport } = this.props;
		const platform = Util.getPlatform();
		const options: any = { 
			properties: [ 'openFile' ],
			filters: [
				{ name: '', extensions: [ 'zip', 'md' ] }
			]
		};

		if (platform == I.Platform.Mac) {
			options.properties.push('openDirectory');
		};

		window.Electron.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			close();
			onImport(I.ImportType.Markdown, { path: files[0] });
		});
	};

};

export default PopupSettingsPageImportMarkdown;