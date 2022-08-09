import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button } from 'ts/component';
import { I, translate } from 'ts/lib';
import { observer } from 'mobx-react';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onExport: (format: I.ExportFormat) => void;
};

const PopupSettingsPageExportMarkdown = observer(class PopupSettingsPageExportMarkdown extends React.Component<Props, {}> {

	render () {
		const { onExport } = this.props;

		return (
			<div>
				<Head {...this.props} returnTo="index" name={translate('popupSettingsTitle')} />

				<Title text={translate('popupSettingsExportMarkdownTitle')} />
				<Label text={translate('popupSettingsExportMarkdownText')} />

				<Button text={translate('popupSettingsExportOk')} onClick={() => { onExport(I.ExportFormat.Markdown); }} />
			</div>
		);
	};

});

export default PopupSettingsPageExportMarkdown;