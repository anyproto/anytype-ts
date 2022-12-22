import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import sha1 from 'sha1';
import { Title, Label, Pin } from 'Component';
import { I, Storage, translate } from 'Lib';
import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
};

const PopupSettingsPagePinSelect = observer(class PopupSettingsPagePinSelect extends React.Component<Props, object> {

	constructor (props: any) {
		super(props);

		this.onSelectPin = this.onSelectPin.bind(this);
	};

	render () {
		return (
			<div>
				<Head {...this.props} returnTo="pinIndex" name={translate('commonCancel')} />

				<Title text={translate('popupSettingsPinTitle')} />
				<Label text={translate('popupSettingsPinText')} />

				<Pin onSuccess={this.onSelectPin} />
			</div>
		);
	};

	onSelectPin (pin: string) {
		Storage.set('pin', sha1(pin));
		this.props.onPage('pinIndex');
	};

});

export default PopupSettingsPagePinSelect;
