import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Button, Icon, Label, Title } from 'Component';
import { I, translate, U, S } from 'Lib';

const MenuIdentity = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { close } = props;

	const onClick = () => {
		U.Object.openAuto(
			{ id: 'membership', layout: I.ObjectLayout.Settings },
			{ onRouteChange: () => { S.Popup.open('membership', { data: { tier: I.TierType.Builder }}) } },
		);
		close();
	};

	return (
		<>
			<div className="iconWrapper">
				<Icon />
			</div>

			<Title text={translate('headerSettingsIdentityInfoTitle')} />
			<Label text={translate('headerSettingsIdentityInfoText')} />
			<Button className="c36" text={translate('headerSettingsIdentityInfoExplorePlans')} onClick={onClick} />
		</>
	);
}));

export default MenuIdentity;
