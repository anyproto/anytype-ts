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

type TabType = 'config' | 'own' | 'static';

const EMPTY_PEER = (): PeerEntry => ({ peerId: '', addresses: [''] });

const KNOWN_PROTOCOLS = [
	{ id: 'yamux://', label: 'yamux://' },
	{ id: 'quic://', label: 'quic://' },
	{ id: 'tcp://', label: 'tcp://' },
	{ id: 'none', label: '(none)' },
];

function parseAddress(addr: string): { protocol: string; hostPort: string } {
	if (!addr) {
		return { protocol: 'yamux://', hostPort: '' };
	}
	for (const p of ['yamux://', 'quic://', 'tcp://']) {
		if (addr.startsWith(p)) {
			return { protocol: p, hostPort: addr.slice(p.length) };
		}
	}
	const match = addr.match(/^([a-zA-Z0-9_-]+):\/\/(.*)$/);
	if (match) {
		return { protocol: `${match[1]}://`, hostPort: match[2] };
	}
	return { protocol: 'none', hostPort: addr };
}

function buildAddress(protocol: string, hostPort: string): string {
	const hp = hostPort.trim();
	if (!hp) return '';
	if (!protocol || protocol === 'none') {
		return hp;
	}
	return `${protocol}${hp}`;
}

const PeerTable = ({
	title,
	subtitle,
	peers,
	jsonFileName,
	onChange,
}: {
	title: string;
	subtitle: string;
	peers: PeerEntry[];
	jsonFileName: string;
	onChange: (peers: PeerEntry[]) => void;
}) => {
	const tableInputRef = React.useRef<HTMLInputElement>(null);

	const handleTableImport = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const content = event.target?.result as string;
				const parsed = JSON.parse(content);
				let newPeers: PeerEntry[] = [];
				if (Array.isArray(parsed)) {
					newPeers = parsed.map((p: any) => ({
						peerId: String(p.peerId || p.id || ''),
						addresses: Array.isArray(p.addresses) ? p.addresses.map(String) : (p.address ? [String(p.address)] : []),
					})).filter(p => p.peerId || p.addresses.length > 0);
				} else if (parsed && typeof parsed === 'object') {
					if (Array.isArray(parsed.staticPeers)) {
						newPeers = parsed.staticPeers.map((p: any) => ({
							peerId: String(p.peerId || p.id || ''),
							addresses: Array.isArray(p.addresses) ? p.addresses.map(String) : (p.address ? [String(p.address)] : []),
						}));
					} else if (Array.isArray(parsed.ownAddresses)) {
						newPeers = parsed.ownAddresses.map((p: any) => ({
							peerId: String(p.peerId || p.id || ''),
							addresses: Array.isArray(p.addresses) ? p.addresses.map(String) : (p.address ? [String(p.address)] : []),
						}));
					} else if (parsed.peerId || parsed.addresses || parsed.id) {
						newPeers = [{
							peerId: String(parsed.peerId || parsed.id || ''),
							addresses: Array.isArray(parsed.addresses) ? parsed.addresses.map(String) : (parsed.address ? [String(parsed.address)] : []),
						}];
					}
				}
				if (newPeers.length > 0) {
					onChange([...peers, ...newPeers]);
					Preview.toastShow({ text: `Imported ${newPeers.length} peer entry(ies) from ${file.name}` });
				} else {
					throw new Error('No valid peer entries found in JSON');
				}
			} catch (err: any) {
				Preview.toastShow({
					icon: 'notice',
					text: `Failed to import ${jsonFileName}: ${err?.message || 'Invalid format'}`,
				});
			}
			if (tableInputRef.current) tableInputRef.current.value = '';
		};
		reader.readAsText(file);
	};

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
		onChange(next);
	};

	return (
		<div className="networkConfigSection">
			<div className="sectionHeader">
				<div className="headerLeft">
					<Label className="section" text={`${title} (${peers.length})`} />
					<div className="sectionDesc">{subtitle}</div>
				</div>
				<div className="headerActions">
					<input
						type="file"
						ref={tableInputRef}
						accept=".json,application/json"
						style={{ display: 'none' }}
						onChange={handleTableImport}
					/>
					<Button
						size={28}
						icon="menu/action/import"
						text={`Import ${jsonFileName}`}
						onClick={() => tableInputRef.current?.click()}
					/>
					<Button size={28} text={`+ ${translate('commonAdd')}`} onClick={addPeer} />
				</div>
			</div>

			{peers.length === 0 ? (
				<div className="emptyBox">
					No peers configured. Click "+ Add" or "Import {jsonFileName}" above.
				</div>
			) : (
				<div className="peerTable">
					<div className="row isHead">
						<div className="col colPeerId">Peer ID (Node Identity)</div>
						<div className="col colAddresses">Transport Protocol & Listen Address</div>
						<div className="col colAction" />
					</div>

					{peers.map((peer, peerIdx) => (
						<div key={peerIdx} className="row">
							<div className="col colPeerId">
								<Input
									size={28}
									value={peer.peerId}
									placeholder="12D3KooW..."
									onChange={(e, v) => updatePeer(peerIdx, { peerId: v })}
								/>
							</div>

							<div className="col colAddresses">
								{peer.addresses.map((addr, addrIdx) => {
									const { protocol, hostPort } = parseAddress(addr);
									const isCustomProto = !KNOWN_PROTOCOLS.some(p => p.id === protocol);

									const onProtocolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
										const newProto = e.target.value;
										const nextAddr = buildAddress(newProto, hostPort);
										updateAddress(peerIdx, addrIdx, nextAddr);
									};

									const onHostPortChange = (e: any, v: string) => {
										const nextAddr = buildAddress(protocol, v);
										updateAddress(peerIdx, addrIdx, nextAddr);
									};

									return (
										<div key={addrIdx} className="addrRow">
											<select
												className="protocolSelect"
												value={protocol}
												onChange={onProtocolChange}
											>
												{isCustomProto && (
													<option value={protocol}>{protocol}</option>
												)}
												{KNOWN_PROTOCOLS.map(p => (
													<option key={p.id} value={p.id}>{p.label}</option>
												))}
											</select>
											<Input
												size={28}
												value={hostPort}
												placeholder="192.168.1.1:5000"
												onChange={onHostPortChange}
											/>
											{peer.addresses.length > 1 && (
												<div
													className="removeAddr"
													onClick={() => removeAddress(peerIdx, addrIdx)}
													title="Remove Address"
												>
													<Icon name="menu/action/remove" size={14} />
												</div>
											)}
										</div>
									);
								})}

								<span
									className="addAddrBtn"
									onClick={() => addAddress(peerIdx)}
								>
									+ Add Address
								</span>
							</div>

							<div className="col colAction">
								<div
									className="deletePeerBtn"
									onClick={() => removePeer(peerIdx)}
									title="Delete Entire Peer Entry"
								>
									<Icon name="menu/action/remove" size={16} color="red" />
								</div>
							</div>
						</div>
					))}
				</div>
			)}
			<div className="helperText" style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: '1.4' }}>
				<i>Addresses can be entered with protocol prefixes (<code>yamux://</code>, <code>quic://</code>, <code>tcp://</code>) or bare IP:port. Anytype heart engine supports both formats natively.</i>
			</div>
		</div>
	);
};

const PageMainSettingsNetworkConfig = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { account } = S.Auth;
	const { dataPath } = S.Common;

	const configFileInputRef = React.useRef<HTMLInputElement>(null);

	const [activeTab, setActiveTab] = useState<TabType>('config');
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
				Preview.toastShow({
					icon: 'notice',
					text: `Failed to save network configuration: ${result.error}`,
				});
			} else {
				Preview.toastShow({ text: 'Network configuration saved' });

				S.Popup.open('confirm', {
					data: {
						iconParam: { name: 'sync/globe' },
						title: 'Restart Required',
						text: 'Network configuration changes have been saved. You must restart Anytype for the new network listener and peer settings to take effect.',
						textConfirm: 'Restart Now',
						textCancel: 'Restart Later',
						onConfirm: () => {
							Renderer.send('exit', true);
						},
					},
				});
			};
		});
	};

	const handleConfigImport = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const content = event.target?.result as string;
				const parsed = JSON.parse(content);
				const cfg = parsed.config || parsed;
				if (cfg && typeof cfg === 'object') {
					setConfig(prev => ({ ...prev, ...cfg }));
					Preview.toastShow({ text: `Imported config from ${file.name}` });
				} else {
					throw new Error('Invalid config format');
				}
			} catch (err: any) {
				Preview.toastShow({
					icon: 'notice',
					text: `Failed to import config.json: ${err?.message || 'Invalid format'}`,
				});
			}
			if (configFileInputRef.current) configFileInputRef.current.value = '';
		};
		reader.readAsText(file);
	};

	useEffect(() => { load(); }, [accountPath]);

	if (isLoading) {
		return (
			<>
				<Title text="Network Configuration" />
				<div className="emptyBox">
					{translate('commonLoading')}
				</div>
			</>
		);
	};

	const tabs: { id: TabType; name: string }[] = [
		{ id: 'config', name: 'Node Configuration' },
		{ id: 'own', name: `Local Listen Addresses (${ownAddresses.length})` },
		{ id: 'static', name: `Static Peers (${staticPeers.length})` },
	];

	return (
		<>
			<div className="titleWrapper">
				<div>
					<Title text="Network Configuration" />
					<div className="titleSub">Manage P2P node network identity, local listen endpoints, and bootstrap static peers.</div>
				</div>
				<Button
					color="accent"
					size={32}
					text={isSaving ? translate('commonSaving') : translate('commonSave')}
					onClick={onSave}
					className={isSaving ? 'disabled' : ''}
				/>
			</div>

			<div className="tabs">
				{tabs.map(item => (
					<div
						key={item.id}
						className={['tab', item.id === activeTab ? 'active' : ''].join(' ')}
						onClick={() => setActiveTab(item.id)}
					>
						<span className="label">{item.name}</span>
					</div>
				))}
			</div>

			<div className="tabContent">
				{activeTab === 'config' && (
					<>
						<div className="sectionHeader">
							<div className="headerLeft">
								<Label className="section" text="Node Identity & Discovery Parameters" />
								<div className="sectionDesc">Configuration parameters stored in config.json</div>
							</div>
							<div className="headerActions">
								<input
									type="file"
									ref={configFileInputRef}
									accept=".json,application/json"
									style={{ display: 'none' }}
									onChange={handleConfigImport}
								/>
								<Button
									size={28}
									icon="menu/action/import"
									text="Import config.json"
									onClick={() => configFileInputRef.current?.click()}
								/>
							</div>
						</div>

						<div className="configGrid">
							<div className="configCard">
								<div className="cardTitle">
									<Icon name="menu/settings/network" size={16} />
									Node Identity & Listener
								</div>
								<div className="field">
									<div className="fieldLabel">Host Address (Listen Multiaddr)</div>
									<Input
										size={28}
										value={config.HostAddr}
										placeholder="/ip4/0.0.0.0/tcp/49193"
										onChange={(e, v) => setConfig({ ...config, HostAddr: v })}
									/>
									<div className="fieldDesc">Multiaddr binding used by the libp2p network stack.</div>
								</div>
								<div className="field">
									<div className="fieldLabel">Network ID</div>
									<Input
										size={28}
										value={config.NetworkId}
										placeholder="N83gJpVd9..."
										onChange={(e, v) => setConfig({ ...config, NetworkId: v })}
									/>
									<div className="fieldDesc">Unique network/cluster ID for swarm isolation.</div>
								</div>
							</div>

							<div className="configCard">
								<div className="cardTitle">
									<Icon name="menu/settings/common" size={16} />
									Peer Discovery & Timeouts
								</div>
								<div className="field">
									<div className="fieldLabel">Local Peer Timeout (ms)</div>
									<Input
										size={28}
										value={String(config.LocalPeerTimeoutMs)}
										placeholder="10000"
										onChange={(e, v) => setConfig({ ...config, LocalPeerTimeoutMs: Number(v) || 0 })}
									/>
									<div className="fieldDesc">Maximum duration to wait during local peer handshakes.</div>
								</div>
								<div className="field">
									<div className="fieldLabel">Local Peer Ban TTL (s)</div>
									<Input
										size={28}
										value={String(config.LocalPeerBanTtlSec)}
										placeholder="60"
										onChange={(e, v) => setConfig({ ...config, LocalPeerBanTtlSec: Number(v) || 0 })}
									/>
									<div className="fieldDesc">Cooldown period before retrying failed or disconnected peers.</div>
								</div>
							</div>
						</div>

						{/* 1-Click Peer Share / Connection Card */}
						<div className="sharePeerCard">
							<div className="shareHeader">
								<div className="shareTitle">
									<Icon name="sync/globe" size={16} />
									<span>Share Node Connection (Peer Identity)</span>
								</div>
								<div className="shareActions">
									<Button
										size={28}
										icon="menu/action/copy"
										text="Copy Peer Info (JSON)"
										onClick={() => {
											const primaryPeerId = ownAddresses[0]?.peerId || config.NetworkId || account?.id || '';
											const addrs = ownAddresses[0]?.addresses?.filter(Boolean) || (config.HostAddr ? [config.HostAddr] : []);
											const payload = {
												peerId: primaryPeerId,
												addresses: addrs,
											};
											U.Common.clipboardCopy({ text: JSON.stringify(payload, null, 2) });
											Preview.toastShow({ text: 'Peer connection payload copied to clipboard' });
										}}
									/>
								</div>
							</div>
							<div className="shareBody">
								<div className="shareRow">
									<div className="shareLabel">Your Peer ID</div>
									<div
										className="shareValue"
										onClick={() => {
											const pid = ownAddresses[0]?.peerId || config.NetworkId || account?.id || '';
											if (pid) {
												U.Common.clipboardCopy({ text: pid });
												Preview.toastShow({ text: 'Peer ID copied to clipboard' });
											}
										}}
										title="Click to copy Peer ID"
									>
										<code>{ownAddresses[0]?.peerId || config.NetworkId || account?.id || '(No peer ID configured)'}</code>
										<Icon name="menu/action/copy" size={13} />
									</div>
								</div>
								<div className="shareRow">
									<div className="shareLabel">Advertised Listen Addresses</div>
									<div className="shareValueList">
										{(ownAddresses[0]?.addresses?.filter(Boolean) || []).length > 0 ? (
											ownAddresses[0].addresses.filter(Boolean).map((addr, i) => (
												<span
													key={i}
													className="addrChip"
													onClick={() => {
														U.Common.clipboardCopy({ text: addr });
														Preview.toastShow({ text: `Copied ${addr}` });
													}}
													title="Click to copy address"
												>
													{addr}
													<Icon name="menu/action/copy" size={12} />
												</span>
											))
										) : config.HostAddr ? (
											<span
												className="addrChip"
												onClick={() => {
													U.Common.clipboardCopy({ text: config.HostAddr });
													Preview.toastShow({ text: `Copied ${config.HostAddr}` });
												}}
												title="Click to copy Host Multiaddr"
											>
												{config.HostAddr}
												<Icon name="menu/action/copy" size={12} />
											</span>
										) : (
											<span className="noAddr">No listen addresses configured. Add one in the "Local Listen Addresses" tab.</span>
										)}
									</div>
								</div>
							</div>
						</div>

						<div className="infoCard">
							<div className="infoItem">
								<span>Engine:</span>
								<strong>anytype-heart (P2P Mesh)</strong>
							</div>
							<div className="infoItem">
								<span>Active Account Data:</span>
								<strong>{account?.id ? `${account.id.slice(0, 12)}...` : 'Active'}</strong>
							</div>
						</div>
					</>
				)}

				{activeTab === 'own' && (
					<PeerTable
						title="Local Node Listen Addresses"
						subtitle="Network endpoints announced by this node to peers on local network and L3 VPNs."
						peers={ownAddresses}
						jsonFileName="own-addresses.json"
						onChange={setOwnAddresses}
					/>
				)}

				{activeTab === 'static' && (
					<PeerTable
						title="Static & Bootstrap Peers"
						subtitle="Explicit node addresses dialled directly on startup (e.g. WireGuard, Tailscale, ZeroTier or fixed IP)."
						peers={staticPeers}
						jsonFileName="static-peers.json"
						onChange={setStaticPeers}
					/>
				)}
			</div>
		</>
	);

});

export default PageMainSettingsNetworkConfig;



