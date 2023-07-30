import * as React from 'react';
import { Title, Button } from 'Component';
import { I, translate, analytics } from 'Lib';
import { commonStore } from 'Store';
import Head from '../../head';

class PopupSettingsPageImportNotionWarning extends React.Component<I.PopupSettings> {

	constructor (props: I.PopupSettings) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		return (
			<div>
				<Head {...this.props} returnTo="importNotion" name={translate('commonBack')} />
				<Title text={translate('popupPageSettingsImportNotionWarningTitle')} />

				<div className="listWrapper">
					<ol className="list">
						<li className="label">
							{translate('popupPageSettingsImportNotionWarningLi1')}
						</li>
						<li className="label">
							{translate('popupPageSettingsImportNotionWarningLi2')}
						</li>
						<li className="label">
							{translate('popupPageSettingsImportNotionWarningLi3')}
						</li>
						<li className="label">
							{translate('popupPageSettingsImportNotionWarningLi4')}
						</li>
					</ol>
				</div>

				<Button className="c36" text={translate('popupPageSettingsImportNotionWarningProceed')} onClick={this.onImport} />
			</div>
		);
	};

	onImport (): void {
		const { close, onImport } = this.props;

		analytics.event('ImportNotionProceed');

		close();
		onImport(I.ImportType.Notion, { apiKey: commonStore.notionToken });
	};

};

export default PopupSettingsPageImportNotionWarning;
