import * as React from 'react';
import { Title, Label, Select, Button } from 'Component';
import { I, Util, Storage, translate, analytics } from 'Lib';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';

const PopupSettingsPagePinIndex = observer(class PopupSettingsPagePinIndex extends React.Component<I.PopupSettings> {

	render () {
		const pin = Storage.get('pin');
		const pinTime = commonStore.pinTime / 1000;
		const times = [ 60, 300, 600, 3600 ].map(time => ({ id: time, name: Util.duration(time) }));

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsPinTitle')} />
				<Label className="description" text={translate('popupSettingsPinText')} />
				
				{pin ? (
					<div className="rows">
						<div className="row">
							<div className="side left">
								<Label text="PIN code check time-out" />
							</div>
							<div className="side right">
								<Select 
									id="pinTime" 
									arrowClassName="light" 
									options={times}
									value={String(pinTime || '')} 
									onChange={v => commonStore.pinTimeSet(v)}
									menuParam={{ horizontal: I.MenuDirection.Right }}
								/>
							</div>
						</div>

						<div className="row cp" onClick={this.onChangePin}>
							<Label text={translate('popupSettingsPinChange')} />
						</div>

						<div className="row red cp" onClick={this.onTurnOffPin}>
							<Label text={translate('popupSettingsPinOff')} />
						</div>
					</div>
				): (
					<div className="buttons">
						<Button className="c36" text={translate('popupSettingsPinOn')} onClick={this.onTurnOnPin} />
					</div>
				)}
			</React.Fragment>
		);
	};

	onTurnOnPin = () => {
		const { onPage } = this.props;

		onPage('pinSelect');
		analytics.event('PinCodeOn');
	};

	onTurnOffPin = () => {
		const { onPage, setConfirmPin } = this.props;

		setConfirmPin(() => { 
			Storage.delete('pin');
			onPage('pinIndex');
		});

		onPage('pinConfirm');
		analytics.event('PinCodeOff');
	};

	onChangePin = () => {
		const { onPage, setConfirmPin } = this.props;

		setConfirmPin(() => onPage('pinSelect'));

		onPage('pinConfirm');
		analytics.event('PinCodeChange');
	};

});

export default PopupSettingsPagePinIndex;
