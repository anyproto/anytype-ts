import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Button } from 'Component';
import { I, U, S, translate, analytics, keyboard, sidebar } from 'Lib';

const PageMainVoid = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const spaces = U.Space.getList().filter(it => it.isLocalOk);
	const match = keyboard.getMatch(isPopup);
	const { id } = match.params || {};
	const cn = [ 'wrapper', U.Common.toCamelCase(`void-${id}`) ];

	const onClick = () => {
		U.Menu.spaceCreate({
			element: '#void-button-create-space',
			className: 'spaceCreate',
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
		}, analytics.route.void);
	};

	let title = '';
	let text = '';
	let button = null;

	switch (id) {
		case 'select': {
			text = translate('pageMainVoidSelectText');
			break;
		};

		case 'error': {
			title = translate('pageMainVoidErrorTitle');
			text = translate('pageMainVoidErrorText');
			button = <Button id="void-button-create-space" onClick={onClick} className="c36" text={translate('commonCreateSpace')} />;
			break;
		};
	};

	useEffect(() => {
		if (id == 'select') {
			S.Common.setLeftSidebarState('vault', '');
		};
	}, []);

	useEffect(() => {
		if ((id == 'error') && spaces.length) {
			U.Router.switchSpace(spaces[0].targetSpaceId, '', false, { replace: true }, false);
		};
	}, [ spaces, spaces.length ]);

	return (
		<div className={cn.join(' ')}>
			<div className="container">
				<div className="iconWrapper">
					<Icon />
				</div>

				<Title text={title} />
				<Label text={text} />

				{button}
			</div>
		</div>
	);

}));

export default PageMainVoid;