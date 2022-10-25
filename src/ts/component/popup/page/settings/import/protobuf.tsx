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

const PopupSettingsPageImportProtobuf = observer(class PopupSettingsPageImportProtobuf extends React.Component<Props, {}> {

	render () {
		const { onImport } = this.props;

		return (
			<div>
				<Head {...this.props} returnTo="importIndex" name={translate('popupSettingsImportTitle')} />

				<Button text={translate('popupSettingsImportOk')} onClick={() => { onImport(I.ImportType.Protobuf); }} />
			</div>
		);
	};

});

export default PopupSettingsPageImportProtobuf;