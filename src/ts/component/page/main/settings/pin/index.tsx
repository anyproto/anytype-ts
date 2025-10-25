import React, { forwardRef } from 'react';
import { Title, Label, Select, Button, Icon } from 'Component';
import { I, S, U, translate, analytics } from 'Lib';
import { observer } from 'mobx-react';

const PageMainSettingsPinIndex = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { onPage, setConfirmPin } = props;
	const { pin } = S.Common;
	const pinTime = S.Common.pinTime / 1000;
	const times = [ 60, 300, 600, 3600 ].map(time => ({ id: time, name: U.Date.duration(time) }));

	const onTurnOnPin = () => {
		onPage('pinSelect');
		analytics.event('PinCodeOn');
	};

	const onTurnOffPin = () => {
		setConfirmPin(() => { 
			S.Common.pinRemove();
			window.setTimeout(() => onPage('pinIndex'));
		});

		onPage('pinConfirm');
		analytics.event('PinCodeOff');
	};

	const onChangePin = () => {
		setConfirmPin(() => onPage('pinSelect'));
		onPage('pinConfirm');
		analytics.event('PinCodeChange');
	};

	return (
		<>
			<Title text={translate('popupSettingsPinTitle')} />
			<Label className="description" text={translate('popupSettingsPinText')} />
			
			{pin ? (
				<div className="actionItems">
					<div className="item">
						<Label text={translate('popupSettingsPinCheckTimeOut')} />

						<Select
							id="pinTime"
							arrowClassName="black"
							options={times}
							value={String(pinTime || '')}
							onChange={v => S.Common.pinTimeSet(v)}
							menuParam={{ horizontal: I.MenuDirection.Right }}
						/>
					</div>

					<div className="item" onClick={onChangePin}>
						<Label text={translate('popupSettingsPinChange')} />
						<Icon className="arrow" />
					</div>

					<div className="item red" onClick={onTurnOffPin}>
						<Label text={translate('popupSettingsPinOff')} />
						<Icon className="arrow" />
					</div>
				</div>
			) : (
				<div className="buttons">
					<Button className="c36" text={translate('popupSettingsPinOn')} onClick={onTurnOnPin} />
				</div>
			)}
		</>
	);

}));

export default PageMainSettingsPinIndex;