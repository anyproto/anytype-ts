import React, { forwardRef, useState, useRef } from 'react';
import { Title, Button, Checkbox, Error } from 'Component';
import { I, C, S, U, translate, analytics } from 'Lib';
import { observer } from 'mobx-react';

const PageMainSettingsDelete = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const [ error, setError ] = useState('');
	const checkboxRef = useRef(null);

	const onDelete = () => {
		const check = checkboxRef.current?.getValue();
		if (!check) {
			return;
		};

		C.AccountDelete((message: any) => {
			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			S.Auth.accountSetStatus(message.status);
			S.Menu.closeAllForced();

			U.Router.go('/auth/deleted', { replace: true });
			analytics.event('DeleteAccount');
		});
	};

	const onCheck = () => {
		checkboxRef.current?.toggle();
	};

	return (
		<>
			<Title text={translate('popupSettingsAccountDeleteTitle')} />

			<div className="text">
				<b>{translate('popupSettingsDeleteTitle1')}</b>
				<p className="first">{translate('popupSettingsDeleteText1')}</p>

				<b>{translate('popupSettingsDeleteTitle2')}</b>
				<p>{translate('popupSettingsDeleteText2')}</p>
			</div>

			<div className="check" onClick={onCheck}>
				<Checkbox ref={checkboxRef} value={false} /> {translate('popupSettingsDeleteCheckboxLabel')}
			</div>

			<Button text={translate('commonDelete')} color="red" className="c36" onClick={onDelete} />
			<Error text={error} />
		</>
	);

}));

export default PageMainSettingsDelete;