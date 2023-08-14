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
				<Title text={translate('popupSettingsImportNotionWarningTitle')} />

				<div className="listWrapper">
					<ol className="list">
						<li className="label" dangerouslySetInnerHTML={{ __html: translate('popupSettingsImportNotionWarningLi1') }} />
						<li className="label" dangerouslySetInnerHTML={{ __html: translate('popupSettingsImportNotionWarningLi2') }} />
						<li className="label" dangerouslySetInnerHTML={{ __html: translate('popupSettingsImportNotionWarningLi3') }} />
						<li className="label" dangerouslySetInnerHTML={{ __html: translate('popupSettingsImportNotionWarningLi4') }} />
					</ol>
				</div>

				<Button className="c36" text={translate('popupSettingsImportNotionWarningProceed')} onClick={this.onImport} />
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
