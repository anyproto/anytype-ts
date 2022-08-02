import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Pin } from 'Component';
import { I, Storage, translate } from 'Lib';
import { observer } from 'mobx-react';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
};

const sha1 = require('sha1');

const PopupSettingsPagePinSelect = observer(class PopupSettingsPagePinSelect extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onSelectPin = this.onSelectPin.bind(this);
	};

	render () {
		return (
			<div>
				<Head {...this.props} id="pinIndex" name={translate('commonCancel')} />

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
