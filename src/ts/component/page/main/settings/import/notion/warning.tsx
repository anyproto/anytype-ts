import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Title, Button } from 'Component';
import { I, C, S, U, translate, analytics, Preview } from 'Lib';

const PageMainSettingsImportNotionWarning = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const onImport = () => {
		Preview.toastShow({ text: translate('toastImportStart') });

		C.ObjectImport(S.Common.space, { apiKey: S.Common.notionToken }, [], true, I.ImportType.Notion, I.ImportMode.IgnoreErrors, false, false, false, false);
		U.Space.openDashboard();

		analytics.event('ImportNotionProceed');
	};

	return (
		<div>
			<Title text={translate('popupSettingsImportNotionWarningTitle')} />

			<div className="listWrapper">
				<ol className="list">
					<li className="label" dangerouslySetInnerHTML={{ __html: U.String.sanitize(translate('popupSettingsImportNotionWarningLi1')) }} />
					<li className="label" dangerouslySetInnerHTML={{ __html: U.String.sanitize(translate('popupSettingsImportNotionWarningLi2')) }} />
					<li className="label" dangerouslySetInnerHTML={{ __html: U.String.sanitize(translate('popupSettingsImportNotionWarningLi3')) }} />
					<li className="label" dangerouslySetInnerHTML={{ __html: U.String.sanitize(translate('popupSettingsImportNotionWarningLi4')) }} />
				</ol>
			</div>

			<Button className="c36" text={translate('popupSettingsImportNotionWarningProceed')} onClick={onImport} />
		</div>
	);

}));

export default PageMainSettingsImportNotionWarning;