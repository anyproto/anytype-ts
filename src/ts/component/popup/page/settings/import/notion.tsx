import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { IconObject, Title, Label, Button } from 'ts/component';
import { I, translate } from 'ts/lib';
import { observer } from 'mobx-react';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (format: I.ImportFormat) => void;
};

const PopupSettingsPageImportNotion = observer(class PopupSettingsPageImportNotion extends React.Component<Props, {}> {

	render () {
		const { onImport } = this.props;

		return (
			<div>
				<Head {...this.props} returnTo="importIndex" name={translate('popupSettingsImportTitle')} />

				<Title text={translate('popupSettingsImportHow')} />
				<Label text={translate('popupSettingsImportFirst')} />

				<div className="path">
					<b>{translate('popupSettingsImportPageTitle')}</b><br/>
					Three dots menu on the top-left corner → <IconObject object={{ iconEmoji: ':paperclip:' }} /> Export →  <br/> Export format : "Markdown & CSV".
				</div>

				<Label className="last" text={translate('popupSettingsImportZip')} />
				
				<Button text={translate('popupSettingsImportOk')} onClick={() => { onImport(I.ImportFormat.Notion); }} />

				<Label className="last" text={translate('popupSettingsImportWarning')} />
			</div>
		);
	};

});

export default PopupSettingsPageImportNotion;