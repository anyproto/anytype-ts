import * as React from 'react';
import { Title, Button } from 'Component';
import { I, C, S, U, translate, analytics } from 'Lib';
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
		const { id, close } = this.props;

		analytics.event('ImportNotionProceed');

		close();
		C.ObjectImport(S.Common.space, { apiKey: S.Common.notionToken }, [], true, I.ImportType.Notion, I.ImportMode.IgnoreErrors, false, false, false, false, (message: any) => {
			if (!message.error.code) {
				const { collectionId, count } = message;

				if (collectionId) {
					S.Popup.replace(id, 'objectManager', { 
						data: { 
							collectionId, 
							type: I.ObjectManagerPopup.Favorites,
						} 
					});
				};

				analytics.event('Import', { middleTime: message.middleTime, type: I.ImportType.Notion, count });
			};
		});
	};

};

export default PopupSettingsPageImportNotionWarning;
