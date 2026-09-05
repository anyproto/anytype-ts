import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { MenuItemVertical, Title } from 'Component';
import * as I from 'Interface';

/**
 * Connected peers of the start-up run as three groups (local peers, file nodes, sync nodes, the
 * node groups split by transport) and the debug dump, opened from the vault's progress block.
 */
const MenuRecoveryPeers = forwardRef<{}, I.Menu>((props, ref) => {

	const { onKeyDown, setActive } = props;
	const n = useRef(-1);
	const keydownHandler = useRef(null);
	const peers = Array.from(S.Recovery.peers.values()).filter(it => it.openConnections > 0);
	const items: any[] = [
		{ id: 'copy', name: translate('recoveryStatusCopyDebug') },
	];

	const rebind = () => {
		unbind();
		keydownHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
	};

	const onClick = (e: any, item: any) => {
		S.Menu.closeAll();

		switch (item.id) {
			case 'copy': {
				S.Recovery.copyDebugInfo();
				break;
			};
		};
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	// Network nodes of one type. The total always leads, so a peer on a transport we do not name
	// is still counted; the breakdown follows when there is one, each transport with nothing on
	// it left out
	const getNodes = (type: string): string => {
		const list = peers.filter(it => (it.kind == I.RecoveryPeerKind.Network) && it.nodeTypes.includes(type));
		const quic = list.filter(it => it.transport == 'quic').length;
		const tcp = list.filter(it => it.transport == 'yamux').length;
		const parts = [];

		if (quic) {
			parts.push(`${quic} QUIC`);
		};

		if (tcp) {
			parts.push(`${tcp} TCP`);
		};

		return parts.length ? `${list.length} (${parts.join(' / ')})` : String(list.length);
	};

	// Only local peers that answered the space exchange with something of yours count here:
	// a nearby device without your channels has no part in this sync
	const local = peers.filter(it => (it.kind == I.RecoveryPeerKind.Local) && it.exchanged && (it.hasAccountSpace || (it.sharedSpaceCount > 0)));

	const rows = [
		{ id: 'local', name: translate('menuRecoveryPeersLocal'), value: String(local.length) },
		{ id: 'file', name: translate('menuRecoveryPeersFile'), value: getNodes('file') },
		{ id: 'sync', name: translate('menuRecoveryPeersSync'), value: getNodes('tree') },
	];

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems: () => items,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
	}), []);

	return (
		<>
			<div className="data">
				<Title text={translate('menuRecoveryPeersTitle')} />

				<div className="rows">
					{rows.map(row => (
						<div key={row.id} className="row">
							<div className="name">{row.name}</div>
							<div className="value">{row.value}</div>
						</div>
					))}
				</div>
			</div>

			<div className="items">
				{items.map((item: any, i: number) => (
					<MenuItemVertical
						key={i}
						{...item}
						onClick={e => onClick(e, item)}
						onMouseEnter={e => onMouseEnter(e, item)}
					/>
				))}
			</div>
		</>
	);

});

export default MenuRecoveryPeers;
