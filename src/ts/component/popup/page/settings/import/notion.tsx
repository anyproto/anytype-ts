import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Button, Input, Label } from 'Component';
import { I, translate } from 'Lib';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (type: I.ImportType, param: any) => void;
};

const PopupSettingsPageImportNotion = observer(class PopupSettingsPageImportNotion extends React.Component<Props, object> {

	ref: any = null;

	constructor (props: Props) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		return (
			<div>
				<Head {...this.props} returnTo="importIndex" name={translate('popupSettingsImportTitle')} />
				<Title text={translate('popupSettingsImportHow')} />
				<Label text="API Key:"/>
				<Input ref={(ref: any) => { this.ref = ref; }} />
				<Button text={translate('popupSettingsImportOk')} onClick={this.onImport} />
			</div>
		);
	};

	onImport () {
		const { close, onImport } = this.props;

		close();
		onImport(I.ImportType.Notion, { apiKey: this.ref.getValue() });
	};

};

export default PopupSettingsPageImportNotion;