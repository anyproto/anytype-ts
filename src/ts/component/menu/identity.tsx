import React, { forwardRef } from 'react';
import { Button, Icon, Label, Title } from 'Component';
import * as I from 'Interface';

const MenuIdentity = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { close } = props;

	const onClick = () => {
		Action.openSettings('membership', '');
		close();
	};

	return (
		<>
			<div className="iconWrapper">
				<Icon name="header/anyName" color="default" />
			</div>

			<Title text={translate('headerSettingsIdentityInfoTitle')} />
			<Label text={translate('headerSettingsIdentityInfoText')} />
			<Button size={36} text={translate('headerSettingsIdentityInfoExplorePlans')} onClick={onClick} />
		</>
	);
});

export default MenuIdentity;
