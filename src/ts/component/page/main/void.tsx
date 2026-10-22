import React, { forwardRef, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon, Title, Label, Button, Frame, RecoveryStatus } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';

const PageMainVoid = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const spaces = U.Menu.getVaultItems().filter(it => U.Space.canAutoOpen(it));
	const match = keyboard.getMatch(isPopup);
	const { id } = match.params || {};
	const cn = [ 'wrapper', U.String.toCamelCase(`void-${id}`) ];
	const isLoading = id == 'loading';
	const isRecovering = S.Recovery.isActive;
	const openedRef = useRef('');

	// The page is an observer and the list is rebuilt on every render, so the effect below keys off
	// the ids rather than the array: without it each recovery event would fire another WorkspaceOpen
	const spaceIds = spaces.map(it => it.targetSpaceId).join(',');

	// One attempt at a time. The attempted space stays in the list while its WorkspaceOpen is in
	// flight, so that is the latch; when it fails, canAutoOpen drops it and the next candidate -
	// which the list re-sorts on its own - gets its turn
	const open = (space: any, useFallback: boolean) => {
		const current = openedRef.current;

		if (!space || (current && spaces.some(it => it.targetSpaceId == current))) {
			return;
		};

		openedRef.current = space.targetSpaceId;
		U.Router.switchSpace(space.targetSpaceId, '', false, { replace: true }, useFallback);
	};

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
	let icon = '';
	let button = null;

	switch (id) {
		case 'select': {
			text = translate('pageMainVoidSelectText');
			icon = 'state/select';
			break;
		};

		case 'error': {
			title = translate('pageMainVoidErrorTitle');
			text = translate('pageMainVoidErrorText');
			icon = 'state/error';
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

		case 'empty': {
			text = translate('pageMainVoidEmptyText');
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
		if (id == 'error') {
			open(spaces[0], false);
		};

		// The loading void waits for the start-up run: the first loaded channel opens (the one
		// used last if it is among them), and if the run ends with nothing to open the honest
		// empty state takes over
		if (isLoading) {
			if (spaces.length) {
				const last = Storage.get('spaceId');

				open(spaces.find(it => it.targetSpaceId == last) || spaces[0], true);
			} else
			if (!isRecovering) {
				U.Router.go('/main/void/error', { replace: true });
			};
		};
	}, [ spaceIds, isRecovering ]);

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={id}
				className={cn.join(' ')}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1, transition: { duration: 0.12 } }}
				exit={{ opacity: 0, transition: { duration: 0.08 } }}
			>
				<div className="side left">
					<Icon
						name="widget/vaultToggle" className="vaultToggle" withBackground={true}
						onClick={() => sidebar.leftPanelToggle(true, true)}
						tooltipParam={{
							text: translate('commonVault'),
							typeY: I.MenuDirection.Bottom,
						}}
					/>

					{id == 'empty' ? (
						<Icon
							name="header/widget" withBackground={true}
							onClick={() => sidebar.leftPanelSubPageToggle('widget', true, true)}
							tooltipParam={{
								text: translate('commonWidgets'),
								caption: keyboard.getCaption('widget'),
								typeY: I.MenuDirection.Bottom,
							}}
						/>
					) : ''}
				</div>

				<Frame>
					{isLoading ? <RecoveryStatus inFlow={true} withDebug={false} /> : (
						<>
							{icon ? (
								<div className="iconWrapper">
									<Icon name={icon} size={56} />
								</div>
							) : ''}

							<Title text={title} />
							<Label text={text} />

							<div className="buttons">
								{button}
							</div>
						</>
					)}
				</Frame>

				{isLoading ? (
					<div className="bottom">
						<div className="small" onClick={() => S.Recovery.copyDebugInfo()}>{translate('recoveryStatusCopyDebug')}</div>
					</div>
				) : ''}
			</motion.div>
		</AnimatePresence>
	);

});

export default PageMainVoid;