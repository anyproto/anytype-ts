import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Select } from 'Component';
import { I, Util, Storage, translate, analytics } from 'Lib';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	setConfirmPin: (v: () => void) => void;
};

const PopupSettingsPagePinIndex = observer(class PopupSettingsPagePinIndex extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onTurnOnPin = this.onTurnOnPin.bind(this);
		this.onTurnOffPin = this.onTurnOffPin.bind(this);
		this.onChangePin = this.onChangePin.bind(this);
	};

	render () {
		const pin = Storage.get('pin');
		const pinTime = commonStore.pinTime / 1000;
		const times: any[] = [
			{ id: 60 },
			{ id: 300 },
			{ id: 600 },
			{ id: 3600 },
		].map((it: any) => {
			it.name = Util.duration(it.id);
			return it;
		});

		return (
			<div>
				<Head {...this.props} returnTo="account" name={translate('popupSettingsAccountTitle')} />

				<Title text={translate('popupSettingsPinTitle')} />
				<Label className="description" text={translate('popupSettingsPinText')} />

				<div className="rows">
					{pin ? (
						<React.Fragment>
							<div className="row red" onClick={this.onTurnOffPin}>
								<Label text={translate('popupSettingsPinOff')} />
							</div>

							<div className="row flex">
								<div className="side left">
									<Label text="PIN code check time-out" />
								</div>
								<div className="side right">
									<Select id="pinTime" arrowClassName="light" options={times} value={String(pinTime || '')} onChange={(id: string) => { commonStore.pinTimeSet(id); }}/>
								</div>
							</div>

							<div className="row" onClick={this.onChangePin}>
								<Label text={translate('popupSettingsPinChange')} />
							</div>
						</React.Fragment>
					): (
						<div className="row" onClick={this.onTurnOnPin}>
							<Label text={translate('popupSettingsPinOn')} />
						</div>
					)}
				</div>

			</div>
		);
	};

	onTurnOnPin () {
		const { onPage } = this.props;

		onPage('pinSelect');
		analytics.event('PinCodeOn');
	};

	onTurnOffPin () {
		const { onPage, setConfirmPin } = this.props;

		setConfirmPin(() => { 
			Storage.delete('pin');
			onPage('pinIndex');
		});

		onPage('pinConfirm');
		analytics.event('PinCodeOff');
	};

	onChangePin () {
		const { onPage, setConfirmPin } = this.props;

		setConfirmPin(() => { onPage('pinSelect'); });

		onPage('pinConfirm');
		analytics.event('PinCodeChange');
	};

});

export default PopupSettingsPagePinIndex;
