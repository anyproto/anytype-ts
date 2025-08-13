import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Button } from 'Component';
import { I, U, translate, Action, analytics } from 'Lib';

const PageMainVoid = observer(forwardRef<{}, I.PageComponent>(() => {

	const spaces = U.Space.getList().filter(it => it.isLocalOk);

	const onClick = () => {
		const param = {
			element: '#void-button-create-space',
			className: 'spaceCreate',
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
		};

		Action.spaceCreateMenu(param, analytics.route.void);
	};

	useEffect(() => {
		if (spaces.length) {
			U.Router.switchSpace(spaces[0].targetSpaceId, '', false, { replace: true }, false);
		};
	}, [ spaces, spaces.length ]);

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

}));

export default PageMainVoid;