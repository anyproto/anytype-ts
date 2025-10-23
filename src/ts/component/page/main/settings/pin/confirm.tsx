import React, { forwardRef, useState, useRef } from 'react';
import { Title, Label, Pin, Error } from 'Component';
import { I, S, translate } from 'Lib';
import { observer } from 'mobx-react';

const PageMainSettingsPinConfirm = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { pin } = S.Common;
	const { onPage, setConfirmPin, onConfirmPin } = props;
	const [ error, setError ] = useState<string>('');
	const pinRef = useRef(null);

	const onCheckPin = () => {
		onPage('pinSelect');

		if (onConfirmPin) {
			onConfirmPin();
			setConfirmPin(null);
		};

		setError('');
	};

	const onError = () => {
		pinRef.current?.reset();
		setError(translate('popupSettingsPinError'));
	};

	return (
		<>
			<Title text={translate('popupSettingsPinTitle')} />
			<Label className="description" text={translate('popupSettingsPinVerify')} />
			<Pin 
				ref={pinRef} 
				expectedPin={pin} 
				onSuccess={onCheckPin} 
				onError={onError} 
			/>
			<Error text={error} />
		</>
	);

}));

export default PageMainSettingsPinConfirm;