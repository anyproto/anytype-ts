import React, { forwardRef } from 'react';
import { Title, Button } from 'Component';
import * as I from 'Interface';

const PageMainSettingsImportNotionWarning = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const onImport = () => {
		const targetId = U.Space.getImportTargetId();

		Preview.toastShow({ text: translate('toastImportStart') });

		C.ObjectImport(targetId, { apiKey: S.Common.notionToken, aiParams: U.Data.getImportAiParams() }, [], true, I.ImportType.Notion, I.ImportMode.IgnoreErrors, false, false, false, false);
		U.Space.openImportTarget(targetId);

		analytics.event('ImportNotionProceed', U.Data.getImportAiAnalytics(I.ImportType.Notion));
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

			<Button size={36} text={translate('popupSettingsImportNotionWarningProceed')} onClick={onImport} />
		</div>
	);

});

export default PageMainSettingsImportNotionWarning;