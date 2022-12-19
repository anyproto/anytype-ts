import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { IconObject, Title, Label, Button } from 'Component';
import { I, translate } from 'Lib';
import { observer } from 'mobx-react';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (type: I.ImportType) => void;
};

const PopupSettingsPageImportNotion = observer(class PopupSettingsPageImportNotion extends React.Component<Props, object> {

	render () {
		const { onImport } = this.props;

		return (
			<div>
				<Head {...this.props} returnTo="importIndex" name={translate('popupSettingsImportTitle')} />

				<Title text={translate('popupSettingsImportHow')} />
				<Label text={translate('popupSettingsImportFirst')} />

				<div className="path">
					<b>{translate('popupSettingsImportPageTitle')}</b><br/>
					Three dots menu on the top-left corner → <IconObject object={{ iconEmoji: ':paperclip:' }} /> Export →  <br/> Export format : &quot;Markdown &amp; CSV&quot;.
				</div>

				<Label className="last" text={translate('popupSettingsImportZip')} />
				
				<Button text={translate('popupSettingsImportOk')} onClick={() => { onImport(I.ImportType.Notion); }} />

				<Label className="last" text={translate('popupSettingsImportWarning')} />
			</div>
		);
	};

});

export default PopupSettingsPageImportNotion;