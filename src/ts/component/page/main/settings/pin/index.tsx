import React, { forwardRef, useState, useEffect } from 'react';
import { Title, Label, Select, Button, Icon, Switch } from 'Component';
import * as I from 'Interface';

const PageMainSettingsPinIndex = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { onPage, setConfirmPin } = props;
	const { pin } = S.Common;
	const [ touchId, setTouchId ] = useState({ available: false, enabled: false });
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

	const onTouchId = (e: any, enabled: boolean) => {
		setConfirmPin(() => {
			Renderer.send('setTouchIdEnabled', S.Common.pinId(), enabled);
			onPage('pinIndex');
		});
		onPage('pinConfirm');
	};

	useEffect(() => {
		let disposed = false;

		Renderer.send('getTouchIdState', S.Common.pinId()).then(state => {
			if (!disposed && state) {
				setTouchId(state);
			};
		});

		return () => { disposed = true; };
	}, []);

	return (
		<>
			<Title text={translate('popupSettingsPinTitle')} />
			<Label className="description" text={translate('popupSettingsPinText')} />
			
			{pin ? (
				<div className="actionItems">
					{touchId.available ? (
						<div className="item">
							<Label text={translate('popupSettingsPinTouchId')} />
							<Switch value={touchId.enabled} onChange={onTouchId} />
						</div>
					) : null}
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
						<Icon name="arrow/button" size={8} className="arrow" />
					</div>

					<div className="item red" onClick={onTurnOffPin}>
						<Label text={translate('popupSettingsPinOff')} />
						<Icon name="arrow/button" size={8} className="arrow" />
					</div>
				</div>
			) : (
				<div className="buttons">
					<Button size={36} text={translate('popupSettingsPinOn')} onClick={onTurnOnPin} />
				</div>
			)}
		</>
	);

});

export default PageMainSettingsPinIndex;
