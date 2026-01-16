import React, { forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Button, Frame } from 'Component';
import { I, U, S, translate, analytics, keyboard, sidebar } from 'Lib';

const PageMainVoid = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const spaces = U.Menu.getVaultItems().filter(it => it.isLocalOk);
	const match = keyboard.getMatch(isPopup);
	const { id } = match.params || {};
	const cn = [ 'wrapper', U.String.toCamelCase(`void-${id}`) ];

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
		if (id == 'dashboard') {
			U.Space.openDashboard();
		};

		if (id == 'select') {
			S.Common.setLeftSidebarState('vault', '');
			sidebar.leftPanelSubPageClose(false, false);
		};
	}, []);

	useEffect(() => {
		if ((id == 'error') && spaces.length) {
			U.Router.switchSpace(spaces[0].targetSpaceId, '', false, { replace: true }, false);
		};
	}, [ spaces, spaces.length ]);

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				className={cn.join(' ')}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.1 },
				})}
			>
				<Icon
					className="vaultToggle withBackground"
					onClick={() => sidebar.leftPanelToggle()}
					tooltipParam={{
						text: translate('commonVault'),
						typeY: I.MenuDirection.Bottom,
					}}
				/>

				<Frame>
					<div className="iconWrapper">
						<Icon />
					</div>

					<Title text={title} />
					<Label text={text} />

					<div className="buttons">
						{button}
					</div>
				</Frame>
			</motion.div>
		</AnimatePresence>
	);

}));

export default PageMainVoid;