import React, { forwardRef } from 'react';
import { Icon, Title, Label, Button } from 'Component';
import { I, translate, Action, analytics } from 'Lib';

const PageMainVoid = forwardRef<{}, I.PageComponent>((props) => {

	const onClick = () => {
		const param = {
			element: '#void-button-create-space',
			className: 'spaceCreate',
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
		};

		Action.spaceCreateMenu(param, 'Vault', analytics.route.vault);
	};

	return (
		<div className="wrapper">
			<div className="container">
				<div className="iconWrapper">
					<Icon />
				</div>

				<Title text={translate('pageMainVoidTitle')} />
				<Label text={translate('pageMainVoidText')} />

				<Button id="void-button-create-space" onClick={onClick} className="c36" text={translate('commonCreateSpace')} />
			</div>
		</div>
	);

});

export default PageMainVoid;
