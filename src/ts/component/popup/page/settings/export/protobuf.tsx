import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button } from 'Component';
import { I, translate, Action, C, Renderer } from 'Lib';
import { observer } from 'mobx-react';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onExport: (format: I.ExportFormat, param: any) => void;
};

const PopupSettingsPageExportProtobuf = observer(class PopupSettingsPageExportProtobuf extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		return (
			<div>
				<Head {...this.props} returnTo="exportIndex" name={translate('popupSettingsExportTitle')} />

				<Title text={translate('popupSettingsExportProtobufTitle')} />
				<Label text={translate('popupSettingsExportProtobufText')} />

				<Button text={translate('popupSettingsExportOk')} onClick={this.onClick} />
			</div>
		);
	};

	onClick () {
		Action.openDir({
			buttonLabel: 'Export',
		}, paths => {
			C.ObjectListExport(paths[0], [], I.ExportFormat.Protobuf, true, true, false, true, true, (message: any) => {
				if (!message.error.code) {
					Renderer.send('pathOpen', paths[0]);
				};
			});
		});
	};

});

export default PopupSettingsPageExportProtobuf;