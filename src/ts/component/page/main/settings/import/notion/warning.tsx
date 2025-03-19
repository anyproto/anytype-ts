import * as React from 'react';
import { Title, Button } from 'Component';
import { I, C, S, U, translate, analytics, Preview } from 'Lib';

class PageMainSettingsImportNotionWarning extends React.Component<I.PageSettingsComponent> {

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		return (
			<div>
				<Title text={translate('popupSettingsImportNotionWarningTitle')} />

				<div className="listWrapper">
					<ol className="list">
						<li className="label" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(translate('popupSettingsImportNotionWarningLi1')) }} />
						<li className="label" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(translate('popupSettingsImportNotionWarningLi2')) }} />
						<li className="label" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(translate('popupSettingsImportNotionWarningLi3')) }} />
						<li className="label" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(translate('popupSettingsImportNotionWarningLi4')) }} />
					</ol>
				</div>

				<Button className="c36" text={translate('popupSettingsImportNotionWarningProceed')} onClick={this.onImport} />
			</div>
		);
	};

	onImport (): void {
		Preview.toastShow({ text: translate('toastImportStart') });

		C.ObjectImport(S.Common.space, { apiKey: S.Common.notionToken }, [], true, I.ImportType.Notion, I.ImportMode.IgnoreErrors, false, false, false, false);
		U.Space.openDashboard();

		analytics.event('ImportNotionProceed');
	};

};

export default PageMainSettingsImportNotionWarning;
