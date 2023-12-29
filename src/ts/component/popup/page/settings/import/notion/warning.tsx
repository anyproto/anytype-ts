import * as React from 'react';
import { Title, Button } from 'Component';
import { I, C, translate, analytics, UtilCommon } from 'Lib';
import { commonStore, popupStore } from 'Store';
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
						<li className="label" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(translate('popupSettingsImportNotionWarningLi1')) }} />
						<li className="label" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(translate('popupSettingsImportNotionWarningLi2')) }} />
						<li className="label" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(translate('popupSettingsImportNotionWarningLi3')) }} />
						<li className="label" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(translate('popupSettingsImportNotionWarningLi4')) }} />
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
		C.ObjectImport(commonStore.space, { apiKey: commonStore.notionToken }, [], true, I.ImportType.Notion, I.ImportMode.IgnoreErrors, false, false, false, false, (message: any) => {
			if (!message.error.code) {
				const { collectionId } = message;

				if (collectionId) {
					popupStore.close(id, () => {
						popupStore.open('objectManager', { 
							data: { 
								collectionId, 
								type: I.ObjectManagerPopup.Favorites,
							} 
						});
					});
				};

				analytics.event('Import', { middleTime: message.middleTime, type: I.ImportType.Notion });
			};
		});
	};

};

export default PopupSettingsPageImportNotionWarning;
