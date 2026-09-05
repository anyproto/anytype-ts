import React, { forwardRef, useEffect } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';

const ID = 'vault-recovery';

/**
 * Start-up progress at the top of the vault while channels are still being fetched: a spinner,
 * the count, and an info button that opens the connected-peers menu. In the icons-only vault it
 * collapses to the spinner, which carries the count as a tooltip and opens the menu itself.
 */
const RecoveryProgress = forwardRef<{}, {}>((props, ref) => {

	const { isActive } = S.Recovery;
	const { vaultIsMinimal } = S.Common;

	// The menu is anchored to this block; when the run ends the anchor goes with it, and a menu
	// left open would float over the sidebar with nothing to close it
	useEffect(() => {
		if (!isActive && S.Menu.isOpen('recoveryPeers')) {
			S.Menu.close('recoveryPeers');
		};
	}, [ isActive ]);

	if (!isActive) {
		return null;
	};

	const { loaded, total } = S.Recovery.getChannelCounts();
	const text = total ? U.String.sprintf(translate('vaultRecoveryProgressCount'), loaded, total) : translate('vaultRecoveryProgress');
	const cn = [ 'recoveryProgress', (vaultIsMinimal ? 'isMinimal' : '') ];

	const onInfo = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		// Anchored to the button, not the row: the row spans the whole sidebar, so centring on it
		// would put the menu nowhere near what was clicked
		S.Menu.open('recoveryPeers', {
			element: `#${ID} ${vaultIsMinimal ? '.spinner' : '#button-recovery-info'}`,
			classNameWrap: 'fromSidebar',
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
		});
	};

	const onMouseEnter = (e: any) => {
		if (vaultIsMinimal) {
			Preview.tooltipShow({ text, element: e.currentTarget, typeY: I.MenuDirection.Bottom });
		};
	};

	const onMouseLeave = () => {
		if (vaultIsMinimal) {
			Preview.tooltipHide(false);
		};
	};

	return (
		<div
			id={ID}
			className={cn.join(' ')}
			onClick={vaultIsMinimal ? onInfo : undefined}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<div className="spinner" />

			{!vaultIsMinimal ? (
				<>
					<div className="text">{text}</div>
					<Icon
						id="button-recovery-info"
						name="common/info"
						className="info"
						withBackground={true}
						tooltipParam={{ text: translate('vaultRecoveryProgressInfo'), typeY: I.MenuDirection.Bottom }}
						onClick={onInfo}
						onMouseDown={e => e.stopPropagation()}
					/>
				</>
			) : ''}
		</div>
	);

});

export default RecoveryProgress;
