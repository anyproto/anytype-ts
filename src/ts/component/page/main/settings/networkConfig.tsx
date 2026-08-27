import React, { forwardRef, useState, useEffect } from 'react';
import { Title, Label, Button, Input, Icon } from 'Component';
import * as I from 'Interface';

interface NetworkConfig {
	HostAddr: string;
	NetworkId: string;
	LocalPeerTimeoutMs: number;
	LocalPeerBanTtlSec: number;
	[key: string]: any;
};

interface PeerEntry {
	peerId: string;
	addresses: string[];
};

const EMPTY_PEER = (): PeerEntry => ({ peerId: '', addresses: [''] });

const PeerList = ({
	title,
	peers,
	onChange,
}: {
	title: string;
	peers: PeerEntry[];
	onChange: (peers: PeerEntry[]) => void;
}) => {
	const updatePeer = (idx: number, patch: Partial<PeerEntry>) => {
		const next = peers.map((p, i) => (i === idx ? { ...p, ...patch } : p));
		onChange(next);
	};

	const updateAddress = (peerIdx: number, addrIdx: number, value: string) => {
		const addresses = peers[peerIdx].addresses.map((a, i) => (i === addrIdx ? value : a));
		updatePeer(peerIdx, { addresses });
	};

	const addAddress = (peerIdx: number) => {
		updatePeer(peerIdx, { addresses: [...peers[peerIdx].addresses, ''] });
	};

	const removeAddress = (peerIdx: number, addrIdx: number) => {
		const addresses = peers[peerIdx].addresses.filter((_, i) => i !== addrIdx);
		updatePeer(peerIdx, { addresses: addresses.length ? addresses : [''] });
	};

	const addPeer = () => onChange([...peers, EMPTY_PEER()]);

	const removePeer = (idx: number) => {
		const next = peers.filter((_, i) => i !== idx);
		onChange(next.length ? next : []);
	};

	return (
		<div className="networkConfigSection">
			<div className="sectionHeader">
				<Label className="section" text={title} />
				<Button size={28} text={translate('commonAdd')} onClick={addPeer} />
			</div>

			{peers.length === 0 ? (
				<div className="networkConfigEmpty">
					<Label text={translate('commonEmpty')} />
				</div>
			) : (
				<div className="networkConfigPeerList">
					{peers.map((peer, peerIdx) => (
						<div key={peerIdx} className="networkConfigPeerCard">
							<div className="networkConfigPeerHeader">
								<Label text="Peer ID" />
								<Icon
									name="common/remove"
									className="remove"
									onClick={() => removePeer(peerIdx)}
								/>
							</div>
							<Input
								value={peer.peerId}
								placeholder="12D3KooW..."
								onChange={v => updatePeer(peerIdx, { peerId: v })}
							/>

							<div className="networkConfigAddressHeader">
								<Label text="Addresses" />
								<div
									className="networkConfigAddBtn"
									onClick={() => addAddress(peerIdx)}
								>
									<Icon name="common/plus" />
								</div>
							</div>

							{peer.addresses.map((addr, addrIdx) => (
								<div key={addrIdx} className="networkConfigAddressRow">
									<Input
										value={addr}
										placeholder="yamux://0.0.0.0:0"
										onChange={v => updateAddress(peerIdx, addrIdx, v)}
									/>
									<Icon
										name="common/remove"
										className="remove"
										onClick={() => removeAddress(peerIdx, addrIdx)}
									/>
								</div>
							))}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

const PageMainSettingsNetworkConfig = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { account } = S.Auth;
	const { dataPath } = S.Common;

	const [config, setConfig] = useState<NetworkConfig>({
		HostAddr: '',
		NetworkId: '',
		LocalPeerTimeoutMs: 10000,
		LocalPeerBanTtlSec: 60,
	});
	const [ownAddresses, setOwnAddresses] = useState<PeerEntry[]>([]);
	const [staticPeers, setStaticPeers] = useState<PeerEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const accountPath = account?.id ? `${dataPath}/${account.id}` : '';

	const load = () => {
		if (!accountPath) {
			setIsLoading(false);
			return;
		};

		setIsLoading(true);
		Renderer.send('readNetworkFiles', accountPath).then((result: any) => {
			if (result && !result.error) {
				if (result.config) {
					setConfig(prev => ({ ...prev, ...result.config }));
				};
				if (Array.isArray(result.ownAddresses)) {
					setOwnAddresses(result.ownAddresses.map((p: any) => ({
						peerId: String(p.peerId || ''),
						addresses: Array.isArray(p.addresses) ? p.addresses.map(String) : [],
					})));
				};
				if (Array.isArray(result.staticPeers)) {
					setStaticPeers(result.staticPeers.map((p: any) => ({
						peerId: String(p.peerId || ''),
						addresses: Array.isArray(p.addresses) ? p.addresses.map(String) : [],
					})));
				};
			};
			setIsLoading(false);
		});
	};

	const onSave = () => {
		if (!accountPath || isSaving) {
			return;
		};

		setIsSaving(true);
		Renderer.send('writeNetworkFiles', {
			accountPath,
			config,
			ownAddresses,
			staticPeers,
		}).then((result: any) => {
			setIsSaving(false);
			if (result && result.error) {
				S.Popup.open('confirm', {
					data: {
						title: translate('commonError'),
						text: result.error,
						textConfirm: translate('commonOk'),
						canCancel: false,
					},
				});
			} else {
				Preview.toastShow({ text: 'Network config saved' });
			};
		});
	};

	useEffect(() => { load(); }, [accountPath]);

	if (isLoading) {
		return (
			<>
				<Title text="Network Config" />
				<div className="networkConfigLoading">
					<Label text={translate('commonLoading')} />
				</div>
			</>
		);
	};

	return (
		<>
			<div className="titleWrapper">
				<Title text="Network Config" />
				<Button
					size={28}
					text={isSaving ? translate('commonSaving') : translate('commonSave')}
					onClick={onSave}
					className={isSaving ? 'disabled' : ''}
				/>
			</div>

			<Label className="section" text="config.json" />
			<div className="actionItems networkConfigFields">
				<div className="item">
					<Label text="Host Address" />
					<Input
						value={config.HostAddr}
						placeholder="/ip4/0.0.0.0/tcp/0"
						onChange={v => setConfig({ ...config, HostAddr: v })}
					/>
				</div>
				<div className="item">
					<Label text="Network ID" />
					<Input
						value={config.NetworkId}
						placeholder="N83gJpVd9..."
						onChange={v => setConfig({ ...config, NetworkId: v })}
					/>
				</div>
				<div className="item">
					<Label text="Local Peer Timeout (ms)" />
					<Input
						value={String(config.LocalPeerTimeoutMs)}
						placeholder="10000"
						onChange={v => setConfig({ ...config, LocalPeerTimeoutMs: Number(v) || 0 })}
					/>
				</div>
				<div className="item">
					<Label text="Local Peer Ban TTL (s)" />
					<Input
						value={String(config.LocalPeerBanTtlSec)}
						placeholder="60"
						onChange={v => setConfig({ ...config, LocalPeerBanTtlSec: Number(v) || 0 })}
					/>
				</div>
			</div>

			<PeerList
				title="own-address.json"
				peers={ownAddresses}
				onChange={setOwnAddresses}
			/>

			<PeerList
				title="static-peers.json"
				peers={staticPeers}
				onChange={setStaticPeers}
			/>
		</>
	);

});

export default PageMainSettingsNetworkConfig;
