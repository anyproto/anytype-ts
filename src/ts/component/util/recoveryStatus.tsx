import React, { forwardRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from 'Component';
import * as I from 'Interface';

interface Props {
	className?: string;
	/** Show nothing for this long after mount: a warm start is over before it and stays quiet */
	delay?: number;
	/** The "Copy debug info" link under the button; off where the screen places it elsewhere */
	withDebug?: boolean;
	/** Stack the block in the page flow instead of composing it around the loader bubble */
	inFlow?: boolean;
	/** The wordmark, for the loader screens that carry no header of their own */
	withLogo?: boolean;
	onCancel?: () => void;
};

/* The drum: all lines share one size, opacity alone gives the depth — even steps back from the front edge */
const DRUM_OPACITY = [ 1, 0.6, 0.3 ];

const getText = (line: I.RecoveryLine, isLocalOnly: boolean): string => {
	switch (line.type) {
		case I.RecoveryLineType.ColdStart: {
			return translate('recoveryStatusColdStart');
		};

		case I.RecoveryLineType.Finished: {
			return translate(line.viewsConfirmed ? 'recoveryStatusDoneConfirmed' : 'recoveryStatusDone');
		};

		case I.RecoveryLineType.LocalPeers: {
			switch (line.localPeers) {
				case I.RecoveryLocalPeersState.Connecting: {
					return translate('recoveryStatusLocalPeersConnecting');
				};

				case I.RecoveryLocalPeersState.Unreachable: {
					return translate('recoveryStatusLocalPeersUnreachable');
				};

				case I.RecoveryLocalPeersState.AccountNotFound: {
					return translate('recoveryStatusLocalPeersAccountNotFound');
				};

				case I.RecoveryLocalPeersState.AccountFound: {
					return translate('recoveryStatusLocalPeersAccountFound');
				};
			};

			return '';
		};
	};

	switch (line.phase) {
		case I.RecoveryPhase.LookingForPeers: {
			// Local-only mode never dials the network: say so where the search starts
			return translate(isLocalOnly ? 'recoveryStatusLookingForPeersLocal' : 'recoveryStatusLookingForPeers');
		};

		case I.RecoveryPhase.Connecting: {
			return translate('recoveryStatusConnecting');
		};

		case I.RecoveryPhase.FetchingAccount: {
			return line.attempt > 1 ? U.String.sprintf(translate('recoveryStatusFetchingAccountAttempt'), line.attempt) : translate('recoveryStatusFetchingAccount');
		};

		case I.RecoveryPhase.LoadingSpaces: {
			return line.total > 0 ? U.String.sprintf(translate('recoveryStatusLoadingChannelsCount'), line.loaded, line.total) : translate('recoveryStatusLoadingChannels');
		};

		case I.RecoveryPhase.WaitingForNetwork: {
			switch (line.errorClass) {
				case I.RecoveryErrorClass.NoNetwork: {
					return translate('recoveryStatusWaitingNoNetwork');
				};

				case I.RecoveryErrorClass.PeerUnreachable: {
					return translate('recoveryStatusWaitingPeerUnreachable');
				};

				case I.RecoveryErrorClass.IncompatibleVersion: {
					return translate('recoveryStatusWaitingIncompatible');
				};
			};

			return translate('recoveryStatusWaiting');
		};

		case I.RecoveryPhase.Done: {
			return translate(line.viewsConfirmed ? 'recoveryStatusDoneConfirmed' : 'recoveryStatusDone');
		};
	};

	return '';
};

/** Whether the line describes something still happening, so the current one gets an ellipsis */
const isProgress = (line: I.RecoveryLine): boolean => {
	switch (line.type) {
		case I.RecoveryLineType.ColdStart: {
			return true;
		};

		case I.RecoveryLineType.Finished: {
			return false;
		};

		case I.RecoveryLineType.LocalPeers: {
			return [ I.RecoveryLocalPeersState.Connecting, I.RecoveryLocalPeersState.AccountNotFound ].includes(line.localPeers);
		};
	};

	return ![ I.RecoveryPhase.Done, I.RecoveryPhase.Failed, I.RecoveryPhase.NotStarted ].includes(line.phase);
};

/**
 * Account start-up block: the headline and its explainer, then the last few lines of S.Recovery,
 * newest at the bottom, older lines faded, the current line pulsing and carrying the ellipsis
 * while the run is active. Every screen mounts the whole block under the bubble. The lines block
 * has a fixed height so the surrounding layout never jumps. With `onCancel` a Cancel button shows
 * under the lines while the run is active.
 */
const RecoveryStatus = forwardRef<{}, Props>(({ className = '', delay = 0, withDebug = true, inFlow = false, withLogo = false, onCancel }, ref) => {

	const [ isVisible, setIsVisible ] = useState(!delay);
	const { lines, isActive } = S.Recovery;
	const isLocalOnly = S.Auth.networkConfig.mode == I.NetworkMode.Local;
	const list = lines.filter(it => getText(it, isLocalOnly));
	const cn = [ 'recoveryStatus', (inFlow ? 'inFlow' : ''), className ];

	useEffect(() => {
		if (!delay) {
			return;
		};

		// Decided once, when the delay is up: with a channel already loaded the main app is at
		// most one WorkspaceOpen away and the vault's progress block takes over, so the block
		// never flashes here
		const timeout = window.setTimeout(() => setIsVisible(!S.Recovery.getChannelCounts().loaded), delay);

		return () => window.clearTimeout(timeout);
	}, []);

	if (!isVisible) {
		return null;
	};

	return (
		<motion.div
			className={cn.join(' ')}
			initial={delay ? { opacity: 0 } : false}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3, ease: [ 0.22, 1, 0.36, 1 ] }}
		>
			{withLogo ? <div className="recoveryLogo" /> : ''}

			<div className="head">
				<div className="recoveryTitle">{translate('recoveryStatusTitle')}</div>
			</div>

			<div className="body">
				<div className="lines">
					{/* popLayout: an exiting line must leave the flex flow, or four lines
						briefly stack inside a block sized for three */}
					<AnimatePresence mode="popLayout">
						{list.slice().reverse().map((line, n) => {
							// n = 0 is the current line, on top right under the bubble; the rest recede downwards
							const isCurrent = !n && isActive;
							const cnl = [ 'line', `n${n}`, (isCurrent ? 'isActive' : '') ];
							const text = getText(line, isLocalOnly) + (isCurrent && isProgress(line) ? '...' : '');
							const opacity = DRUM_OPACITY[n] ?? DRUM_OPACITY[DRUM_OPACITY.length - 1];

							return (
								<motion.div
									key={line.id}
									className={cnl.join(' ')}
									layout="position"
									{...U.Common.animationProps({ initial: { y: -8 }, animate: { y: 0, opacity }, exit: { y: 8 }, transition: { duration: 0.3 } })}
								>
									<span className="text">{text}</span>
								</motion.div>
							);
						})}
					</AnimatePresence>
				</div>

				<AnimatePresence>
					{isActive && (onCancel || withDebug) ? (
						<motion.div key="buttons" className="buttons" {...U.Common.animationProps()}>
							{onCancel ? (
								<div className="animation">
									<Button size={48} color="blank" text={translate('commonCancel')} onClick={onCancel} />
								</div>
							) : ''}

							{withDebug ? (
								<div className="small" onClick={() => S.Recovery.copyDebugInfo()}>{translate('recoveryStatusCopyDebug')}</div>
							) : ''}
						</motion.div>
					) : ''}
				</AnimatePresence>
			</div>
		</motion.div>
	);

});

export default RecoveryStatus;
