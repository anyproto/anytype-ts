import React, { forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon, Title, Label, Button, Frame } from 'Component';
import * as I from 'Interface';

const PageMainVoid = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const spaces = U.Menu.getVaultItems().filter(it => it.isLocalOk);
	const match = keyboard.getMatch(isPopup);
	const { id } = match.params || {};
	const cn = [ 'wrapper', U.String.toCamelCase(`void-${id}`) ];

	const onClick = () => {
		Action.createSpace(analytics.route.void);
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
			button = (
				<Button 
					id="void-button-create-space" 
					onClick={onClick} 
					color="accent" 
					size={36}
					text={translate('commonCreateSpace')}
				/>
			);
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
		<AnimatePresence mode="wait">
			<motion.div
				key={id}
				className={cn.join(' ')}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1, transition: { duration: 0.12 } }}
				exit={{ opacity: 0, transition: { duration: 0.08 } }}
			>
				<Icon
					name="widget/vaultToggle" className="vaultToggle" withBackground={true}
					onClick={() => sidebar.leftPanelToggle(true, true)}
					tooltipParam={{
						text: translate('commonVault'),
						typeY: I.MenuDirection.Bottom,
					}}
				/>

				<Frame>
					<div className="iconWrapper">
						<Icon name={id == 'select' ? 'state/select' : 'state/error'} size={56} />
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

});

export default PageMainVoid;