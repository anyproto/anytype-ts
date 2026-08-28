import React, { useState, useEffect, useMemo } from 'react';
import { Button, Icon } from 'Component';

export interface PeerEntry {
	peerId: string;
	addresses: string[];
};

export interface NodeStatus {
	status: 'checking' | 'online' | 'offline' | 'unknown';
	latencyMs?: number;
	error?: string;
	protocol?: string;
};

interface NetworkTopologyMapProps {
	config: {
		HostAddr?: string;
		NetworkId?: string;
		[key: string]: any;
	};
	ownAddresses: PeerEntry[];
	staticPeers: PeerEntry[];
	statusMap: Record<string, NodeStatus>;
	onCheckAddress: (addr: string) => Promise<void>;
	onCheckAll: () => Promise<void>;
	isProbingAll?: boolean;
};

interface MeshNode {
	id: string;
	peerId: string;
	primaryAddress: string;
	allAddresses: string[];
	protocol: string;
	status: 'checking' | 'online' | 'offline' | 'unknown';
	latencyMs?: number;
	error?: string;
	x: number;
	y: number;
};

export const NetworkTopologyMap: React.FC<NetworkTopologyMapProps> = ({
	config,
	ownAddresses,
	staticPeers,
	statusMap,
	onCheckAddress,
	onCheckAll,
	isProbingAll,
}) => {
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [filterProtocol, setFilterProtocol] = useState<string>('all');
	const [autoPing, setAutoPing] = useState<boolean>(false);
	const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

	// Helper to extract protocol
	const getProtocol = (addr: string): string => {
		if (!addr) return 'TCP';
		if (addr.startsWith('yamux://') || addr.includes('/yamux')) return 'Yamux';
		if (addr.startsWith('quic://') || addr.includes('/quic')) return 'QUIC';
		if (addr.startsWith('ws://') || addr.includes('/ws')) return 'WS';
		if (addr.startsWith('wss://') || addr.includes('/wss')) return 'WSS';
		if (addr.startsWith('tcp://') || addr.includes('/tcp')) return 'TCP';
		return 'TCP';
	};

	// Combine all unique static peers
	const allPeersList = useMemo(() => {
		const list: { peerId: string; addresses: string[] }[] = [];
		staticPeers.forEach((p, idx) => {
			list.push({
				peerId: p.peerId || `Static Node #${idx + 1}`,
				addresses: p.addresses.filter(Boolean),
			});
		});
		return list;
	}, [staticPeers]);

	// Build mesh nodes
	const meshNodes = useMemo(() => {
		return allPeersList.map((peer, idx) => {
			const primaryAddr = peer.addresses[0] || '';
			const proto = getProtocol(primaryAddr);
			const st = statusMap[primaryAddr] || { status: 'unknown' };
			return {
				id: `node-${idx}-${peer.peerId || primaryAddr}`,
				peerId: peer.peerId,
				primaryAddress: primaryAddr,
				allAddresses: peer.addresses,
				protocol: proto,
				status: st.status,
				latencyMs: st.latencyMs,
				error: st.error,
			};
		});
	}, [allPeersList, statusMap]);

	// Filter nodes
	const filteredNodes = useMemo(() => {
		if (filterProtocol === 'all') return meshNodes;
		if (filterProtocol === 'online') return meshNodes.filter(p => p.status === 'online');
		return meshNodes.filter(p => p.protocol.toLowerCase() === filterProtocol.toLowerCase());
	}, [meshNodes, filterProtocol]);

	// Calculate 2D coordinates for Mesh Constellation (Canvas: 760 x 420)
	const SVG_WIDTH = 760;
	const SVG_HEIGHT = 420;
	const PADDING = 70;

	const visualNodes: MeshNode[] = useMemo(() => {
		const count = filteredNodes.length;
		if (count === 0) return [];

		if (count === 1) {
			return [{
				...filteredNodes[0],
				x: SVG_WIDTH / 2,
				y: SVG_HEIGHT / 2,
			}];
		}

		if (count === 2) {
			return [
				{ ...filteredNodes[0], x: SVG_WIDTH * 0.32, y: SVG_HEIGHT / 2 },
				{ ...filteredNodes[1], x: SVG_WIDTH * 0.68, y: SVG_HEIGHT / 2 },
			];
		}

		// Organic Polygon / Ring Distribution
		const radiusX = Math.min(270, (SVG_WIDTH - 2 * PADDING) / 2);
		const radiusY = Math.min(145, (SVG_HEIGHT - 2 * PADDING) / 2);
		const centerX = SVG_WIDTH / 2;
		const centerY = SVG_HEIGHT / 2;

		return filteredNodes.map((node, idx) => {
			const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
			const x = centerX + Math.cos(angle) * radiusX;
			const y = centerY + Math.sin(angle) * radiusY;
			return {
				...node,
				x,
				y,
			};
		});
	}, [filteredNodes]);

	// Build peer-to-peer interconnection links (Mesh Topology)
	const meshLinks = useMemo(() => {
		const links: { from: MeshNode; to: MeshNode; key: string; isOnline: boolean }[] = [];
		const n = visualNodes.length;
		if (n < 2) return links;

		for (let i = 0; i < n; i++) {
			for (let j = i + 1; j < n; j++) {
				const from = visualNodes[i];
				const to = visualNodes[j];
				const isOnline = from.status === 'online' && to.status === 'online';
				links.push({
					from,
					to,
					key: `${from.id}--${to.id}`,
					isOnline,
				});
			}
		}
		return links;
	}, [visualNodes]);

	// Auto-Ping timer
	useEffect(() => {
		if (!autoPing) return;
		const interval = window.setInterval(() => {
			onCheckAll();
		}, 30000);
		return () => window.clearInterval(interval);
	}, [autoPing, onCheckAll]);

	// Selected node details
	const activeNode = useMemo(() => {
		if (!selectedNodeId && visualNodes.length > 0) return visualNodes[0];
		return visualNodes.find(n => n.id === selectedNodeId) || visualNodes[0] || null;
	}, [selectedNodeId, visualNodes]);

	// Stats
	const onlineCount = meshNodes.filter(p => p.status === 'online').length;
	const avgLatency = useMemo(() => {
		const onlineList = meshNodes.filter(p => p.status === 'online' && p.latencyMs);
		if (!onlineList.length) return null;
		const sum = onlineList.reduce((acc, curr) => acc + (curr.latencyMs || 0), 0);
		return Math.round(sum / onlineList.length);
	}, [meshNodes]);

	const copyToClipboard = (text: string) => {
		if (!text) return;
		navigator.clipboard.writeText(text);
		Preview.toastShow({ text: `Copied: ${text.slice(0, 40)}...` });
	};

	return (
		<div className="topologyMapContainer">
			{/* Top Metric Bar */}
			<div className="topologyStatsBar">
				<div className="statItem">
					<span className="statLabel">Peer Nodes</span>
					<span className="statValue highlight">{meshNodes.length} Total</span>
				</div>
				<div className="statItem">
					<span className="statLabel">Live Reachability</span>
					<span className="statValue online">{onlineCount} / {meshNodes.length} Online</span>
				</div>
				<div className="statItem">
					<span className="statLabel">Average Response</span>
					<span className="statValue">{avgLatency !== null ? `${avgLatency} ms` : '—'}</span>
				</div>
				<div className="statItem">
					<span className="statLabel">Cluster Isolation</span>
					<span className="statValue mono">{config.NetworkId ? config.NetworkId.slice(0, 10) + '...' : 'Default'}</span>
				</div>
			</div>

			{/* Controls & Filter Bar */}
			<div className="topologyToolbar">
				<div className="filterGroup">
					<span className="filterLabel">Filter:</span>
					{['all', 'Yamux', 'QUIC', 'TCP', 'WS', 'online'].map(f => (
						<button
							key={f}
							type="button"
							className={['filterChip', filterProtocol === f ? 'active' : ''].join(' ')}
							onClick={() => setFilterProtocol(f)}
						>
							{f === 'all' ? 'All Transports' : f === 'online' ? 'Online Only' : f}
						</button>
					))}
				</div>

				<div className="actionGroup">
					<label className="autoPingToggle">
						<input
							type="checkbox"
							checked={autoPing}
							onChange={e => setAutoPing(e.target.checked)}
						/>
						<span>Auto-Ping (30s)</span>
					</label>

					<Button
						size={28}
						icon="sync/refresh"
						color="primary"
						text={isProbingAll ? 'Probing Mesh...' : 'Test All Nodes'}
						onClick={() => onCheckAll()}
						className={isProbingAll ? 'disabled' : ''}
					/>
				</div>
			</div>

			{/* Interactive Mesh Constellation SVG Canvas */}
			<div className="topologyCanvasWrapper">
				<svg
					className="topologySvg"
					viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
					preserveAspectRatio="xMidYMid meet"
				>
					<defs>
						{/* Node Glow Filter */}
						<filter id="nodeGlow" x="-30%" y="-30%" width="160%" height="160%">
							<feGaussianBlur stdDeviation="4" result="blur" />
							<feComposite in="SourceGraphic" in2="blur" operator="over" />
						</filter>

						{/* Mesh Link Gradients */}
						<linearGradient id="meshLinkOnline" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
							<stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7" />
						</linearGradient>
						<linearGradient id="meshLinkOffline" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor="#6b7280" stopOpacity="0.25" />
							<stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
						</linearGradient>
					</defs>

					{/* Background Constellation Grid */}
					<g opacity="0.15">
						{Array.from({ length: 9 }).map((_, i) => (
							<line
								key={`grid-x-${i}`}
								x1={i * 95}
								y1="0"
								x2={i * 95}
								y2={SVG_HEIGHT}
								stroke="var(--color-text-secondary)"
								strokeWidth="1"
								strokeDasharray="2 6"
							/>
						))}
						{Array.from({ length: 6 }).map((_, i) => (
							<line
								key={`grid-y-${i}`}
								x1="0"
								y1={i * 80}
								x2={SVG_WIDTH}
								y2={i * 80}
								stroke="var(--color-text-secondary)"
								strokeWidth="1"
								strokeDasharray="2 6"
							/>
						))}
					</g>

					{/* Interconnected P2P Mesh Links */}
					{meshLinks.map(link => {
						const isHighlighted =
							hoveredNodeId === link.from.id ||
							hoveredNodeId === link.to.id ||
							selectedNodeId === link.from.id ||
							selectedNodeId === link.to.id;

						return (
							<g key={link.key}>
								<line
									x1={link.from.x}
									y1={link.from.y}
									x2={link.to.x}
									y2={link.to.y}
									stroke={link.isOnline ? 'url(#meshLinkOnline)' : 'url(#meshLinkOffline)'}
									strokeWidth={isHighlighted ? 2.5 : 1.2}
									strokeDasharray={link.isOnline ? 'none' : '4 4'}
									opacity={isHighlighted ? 1 : link.isOnline ? 0.8 : 0.4}
									className="meshLinkLine"
								/>
								{link.isOnline && (
									<line
										x1={link.from.x}
										y1={link.from.y}
										x2={link.to.x}
										y2={link.to.y}
										stroke="#34d399"
										strokeWidth="2.5"
										strokeDasharray="6 24"
										strokeLinecap="round"
										filter="url(#nodeGlow)"
										className="linkPulseStream"
									/>
								)}
							</g>
						);
					})}

					{/* Render Peer Nodes */}
					{visualNodes.map(node => {
						const isSelected = selectedNodeId === node.id;
						const isHovered = hoveredNodeId === node.id;
						const nodeColor =
							node.status === 'online' ? '#10b981' : node.status === 'offline' ? '#ef4444' : node.status === 'checking' ? '#f59e0b' : '#9ca3af';

						return (
							<g
								key={node.id}
								transform={`translate(${node.x}, ${node.y})`}
								className={['topologyNode', isSelected ? 'selected' : '', isHovered ? 'hovered' : ''].join(' ')}
								onClick={() => setSelectedNodeId(node.id)}
								onMouseEnter={() => setHoveredNodeId(node.id)}
								onMouseLeave={() => setHoveredNodeId(null)}
								style={{ cursor: 'pointer' }}
							>
								{/* Outer Selection / Hover Ring */}
								{(isSelected || isHovered) && (
									<circle
										cx="0"
										cy="0"
										r="28"
										fill="none"
										stroke={nodeColor}
										strokeWidth="2"
										strokeDasharray={isSelected ? 'none' : '4 4'}
										opacity={isSelected ? 1 : 0.75}
										className="selectionRing"
									/>
								)}

								{/* Outer Glowing Hex/Circle Base */}
								<circle
									cx="0"
									cy="0"
									r="20"
									fill="var(--color-bg-primary)"
									stroke={nodeColor}
									strokeWidth={isSelected || isHovered ? '3.5' : '2.5'}
									className="nodeCircle"
								/>

								{/* Protocol Tag inside node */}
								<text
									x="0"
									y="3.5"
									textAnchor="middle"
									fontSize="8.5"
									fontWeight="800"
									fill={nodeColor}
								>
									{node.protocol.slice(0, 5)}
								</text>

								{/* Node Name Card Below */}
								<g transform="translate(0, 34)">
									<rect
										x="-55"
										y="-10"
										width="110"
										height="20"
										rx="10"
										fill="var(--color-bg-primary)"
										stroke="var(--color-shape-secondary)"
										strokeWidth="1"
										opacity="0.95"
									/>
									<text
										x="0"
										y="3.5"
										textAnchor="middle"
										fontSize="10"
										fontWeight="600"
										fill="var(--color-text-primary)"
									>
										{node.peerId.length > 12 ? `${node.peerId.slice(0, 10)}...` : node.peerId}
									</text>
								</g>

								{/* Latency badge on top if online */}
								{node.status === 'online' && node.latencyMs !== undefined && (
									<g transform="translate(0, -28)">
										<rect
											x="-22"
											y="-8"
											width="44"
											height="16"
											rx="8"
											fill="#10b981"
										/>
										<text
											x="0"
											y="3.5"
											textAnchor="middle"
											fontSize="9"
											fontWeight="700"
											fill="#ffffff"
										>
											{node.latencyMs}ms
										</text>
									</g>
								)}

								{/* Error badge on top if offline */}
								{node.status === 'offline' && (
									<g transform="translate(0, -28)">
										<rect
											x="-24"
											y="-8"
											width="48"
											height="16"
											rx="8"
											fill="#ef4444"
										/>
										<text
											x="0"
											y="3.5"
											textAnchor="middle"
											fontSize="8.5"
											fontWeight="700"
											fill="#ffffff"
										>
											Offline
										</text>
									</g>
								)}
							</g>
						);
					})}
				</svg>

				{/* Empty State */}
				{filteredNodes.length === 0 && (
					<div className="topologyEmptyOverlay">
						<Icon name="sync/globe" size={32} />
						<div className="emptyTitle">No Peer Nodes Configured</div>
						<div className="emptyDesc">Add peer multiaddrs in the 'Static Peers' tab to visualize your P2P mesh network.</div>
					</div>
				)}
			</div>

			{/* Node Inspector Card */}
			{activeNode && (
				<div className="nodeInspectorCard">
					<div className="inspectorHeader">
						<div className="inspectorTitle">
							<div className={['nodeDot', activeNode.status].join(' ')} />
							<span className="titleText">Peer Node: {activeNode.peerId}</span>
							<span className="protoBadge">{activeNode.protocol}</span>
						</div>

						<Button
							size={26}
							icon="sync/refresh"
							text="Test Node Connectivity"
							onClick={() => onCheckAddress(activeNode.primaryAddress)}
						/>
					</div>

					<div className="inspectorGrid">
						<div className="inspectorField">
							<span className="fLabel">Peer ID:</span>
							<div className="fValueRow">
								<span className="fValue mono">{activeNode.peerId}</span>
								<button
									type="button"
									className="copyMiniBtn"
									onClick={() => copyToClipboard(activeNode.peerId)}
									title="Copy Peer ID"
								>
									Copy
								</button>
							</div>
						</div>

						<div className="inspectorField">
							<span className="fLabel">Primary Multiaddr / Endpoint:</span>
							<div className="fValueRow">
								<span className="fValue mono">{activeNode.primaryAddress || 'None configured'}</span>
								{activeNode.primaryAddress && (
									<button
										type="button"
										className="copyMiniBtn"
										onClick={() => copyToClipboard(activeNode.primaryAddress)}
										title="Copy Multiaddr"
									>
										Copy
									</button>
								)}
							</div>
						</div>

						<div className="inspectorField">
							<span className="fLabel">Live Connectivity & Reachability:</span>
							<span className={['fStatus', activeNode.status].join(' ')}>
								{activeNode.status === 'online' && `Reachable • Socket Response: ${activeNode.latencyMs || 0} ms`}
								{activeNode.status === 'offline' && `Unreachable (${activeNode.error || 'Connection timed out'})`}
								{activeNode.status === 'checking' && 'Testing socket reachability...'}
								{activeNode.status === 'unknown' && 'Not tested yet'}
							</span>
						</div>

						{activeNode.allAddresses.length > 1 && (
							<div className="inspectorField full">
								<span className="fLabel">All Configured Listen Multiaddrs ({activeNode.allAddresses.length}):</span>
								<div className="addrPills">
									{activeNode.allAddresses.map((a, i) => (
										<span key={i} className="addrPill" onClick={() => copyToClipboard(a)}>
											{a}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
