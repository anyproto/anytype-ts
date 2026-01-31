import React, { forwardRef, useState, useRef, useEffect } from 'react';
import sha1 from 'sha1';
import { observer } from 'mobx-react';
import { Title, Pin, Error } from 'Component';
import { I, S, translate } from 'Lib';

const PageMainSettingsPinSelect = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const [ pin, setPin ] = useState('');
	const [ error, setError ] = useState('');
	const { onPage } = props;
	const pinRef = useRef(null);

	const onSuccess = (value: string) => {
		if (!pin) {
			setPin(value);
		} else {
			S.Common.pinSet(sha1(pin));
			onPage('pinIndex');
		};
	};

	const onError = () => {
		pinRef.current?.reset();
		setError(translate('popupSettingsPinSelectError'));
	};

	useEffect(() => {
		pinRef.current?.reset();
	});

	return (
		<div>
			<Title text={translate(pin ? 'popupSettingsPinSelectRepeat' : 'popupSettingsPinSelect')} />
			<Pin 
				ref={pinRef} 
				expectedPin={pin ? sha1(pin) : null} 
				isNumeric={true}
				onSuccess={onSuccess} 
				onError={onError}
			/>
			<Error text={error} />
		</div>
	);

}));

export default PageMainSettingsPinSelect;