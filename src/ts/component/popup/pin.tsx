import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Title, Pin, Error } from 'Component';
import { I, S, keyboard, translate } from 'Lib';

const PopupPin = forwardRef<{}, I.Popup>(({ param, close }, ref) => {

	const { data } = param;
	const { pin } = S.Common;
	const { onError, onSuccess } = data;
	const pinRef = useRef(null);
	const [ error, setError ] = useState('');

	const onSuccessHandler = () => {
		onSuccess?.();
		close();
	};

	const onErrorHandler = () => {
		pinRef.current.reset();	
		setError(translate('authPinCheckError'));	
		onError?.();
	};

	useEffect(() => {
		keyboard.setFocus(true);

		return () => {
			keyboard.setFocus(false);
		};
	}, []);

	return (
		<>
			<Title text={translate('authPinCheckTitle')} />
			<Pin 
				ref={pinRef}
				expectedPin={pin} 
				onSuccess={onSuccessHandler} 
				onError={onErrorHandler}
			/>
			<Error text={error} />
		</>
	);

});

export default PopupPin;