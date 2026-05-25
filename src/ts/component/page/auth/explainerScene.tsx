import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, Label } from 'Component';

interface CardData {
	kind: string;
	icon?: string;
	name?: string;
	type?: string;
	desc?: string;
	avatar?: string;
	flag?: string;
	thumb?: string;
	source?: string;
	img?: string;
}

interface Props {
	channelId: string;
	hasChat: boolean;
	bubbleWidth?: number;
	message: string;
	topContent: CardData;
	linkA: CardData;
	linkB: CardData;
	phase: number;
}

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 28 };
const SPRING_CARD = { type: 'spring' as const, stiffness: 400, damping: 30 };
const EASE_OUT = { duration: 0.4, ease: [ 0, 0, 0.2, 1 ] as [ number, number, number, number ] };
const EASE_STANDARD = { duration: 0.45, ease: [ 0.4, 0, 0.2, 1 ] as [ number, number, number, number ] };

// Card size constants matching SCSS
const CARD_SIZES: Record<string, { w: number; h: number }> = {
	compact:  { w: 349, h: 80 },
	bookmark: { w: 448, h: 152 },
	cover:    { w: 276, h: 170 },
	person:   { w: 276, h: 170 },
	country:  { w: 276, h: 154 },
	video:    { w: 352, h: 200 },
	task:     { w: 352, h: 220 },
};

const SCENE_W = 1064;
const SCENE_H = 500;

const TypingDots: React.FC = () => (
	<div className="typingDots">
		{[ 0, 1, 2 ].map(i => (
			<motion.span
				key={i}
				animate={{ scale: [ 1, 1.4, 1 ], opacity: [ 0.4, 1, 0.4 ] }}
				transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
			/>
		))}
	</div>
);

const CardCompact: React.FC<{ c: CardData }> = ({ c }) => (
	<div className="obCard obCompact">
		<div className="emoji">{c.icon}</div>
		<div className="text">
			<div className="title">{c.name}</div>
			<div className="type">{c.type}</div>
		</div>
	</div>
);

const CardBookmark: React.FC<{ c: CardData }> = ({ c }) => (
	<div className="obCard obBookmark">
		<div className="info">
			<div className="source">{c.source}</div>
			<div className="title">{c.name}</div>
			<div className="desc">{c.desc}</div>
		</div>
		<div className={`thumb ${c.img}`} />
	</div>
);

const CardPerson: React.FC<{ c: CardData }> = ({ c }) => (
	<div className="obCard obPerson">
		<div className={`avatar ${c.avatar}`} />
		<div className="title">{c.name}</div>
		<div className="type">{c.type}</div>
	</div>
);

const CardCountry: React.FC<{ c: CardData }> = ({ c }) => (
	<div className="obCard obCountry">
		<div className={`flag ${c.flag}`} />
		<div className="title">{c.name}</div>
		<div className="type">{c.type}</div>
	</div>
);

const CardVideo: React.FC<{ c: CardData }> = ({ c }) => (
	<div className="obCard obVideo">
		<div className="type">{c.type}</div>
		<div className="title">{c.name}</div>
		<div className="thumbWrap">
			<div className={`thumb ${c.thumb}`} />
		</div>
		<div className="play" />
	</div>
);

const CardCover: React.FC<{ c: CardData }> = ({ c }) => (
	<div className="obCard obCover">
		<div className={`obCoverImg ${c.img}`} />
		<div className="title">{c.name}</div>
		<div className="type">{c.type}</div>
	</div>
);

const CardTask: React.FC<{ c: CardData }> = ({ c }) => {
	let head = null;
	if (c.icon === 'page') {
		head = <Icon name="default/page" />;
	} else
	if (c.icon) {
		head = <div className="emoji">{c.icon}</div>;
	} else {
		head = <Icon className="taskCheck" />;
	};

	return (
		<div className="obCard obTask">
			<div className="head">{head}<div className="title">{c.name}</div></div>
			<div className="type">{c.type}</div>
			<div className="desc">{c.desc}</div>
		</div>
	);
};

const renderCardContent = (c: CardData) => {
	switch (c.kind) {
		case 'compact': return <CardCompact c={c} />;
		case 'bookmark': return <CardBookmark c={c} />;
		case 'person': return <CardPerson c={c} />;
		case 'country': return <CardCountry c={c} />;
		case 'video': return <CardVideo c={c} />;
		case 'cover': return <CardCover c={c} />;
		case 'task': return <CardTask c={c} />;
	};
	return null;
};

const ExplainerScene: React.FC<Props> = ({ channelId, hasChat, bubbleWidth, message, topContent, linkA, linkB, phase }) => {
	const topSize = CARD_SIZES[topContent.kind] || CARD_SIZES.compact;
	const linkASize = CARD_SIZES[linkA.kind]  || CARD_SIZES.compact;
	const linkBSize = CARD_SIZES[linkB.kind]  || CARD_SIZES.compact;

	// Phase-3 positions (absolute in scene)
	const topLeft = (SCENE_W - topSize.w) / 2;
	const topTop = 20;
	const linkALeft = 24;
	const linkATop = SCENE_H - linkASize.h + 60;
	const linkBLeft = SCENE_W - 24 - linkBSize.w;
	const linkBTop = SCENE_H - linkBSize.h + 60;

	// SVG connector endpoints
	const lineOriginX = SCENE_W / 2;
	const lineOriginY = SCENE_H / 2;
	const lineTopX = topLeft + topSize.w / 2;
	const lineTopY = topTop + topSize.h;
	const lineAX = linkALeft + linkASize.w / 2;
	const lineAY = linkATop;
	const lineBX = linkBLeft + linkBSize.w / 2;
	const lineBY = linkBTop;

	const lineLenTop = Math.hypot(lineTopX - lineOriginX, lineTopY - lineOriginY);
	const lineLenA = Math.hypot(lineAX - lineOriginX, lineAY - lineOriginY);
	const lineLenB = Math.hypot(lineBX - lineOriginX, lineBY - lineOriginY);

	// Chat bubble positioning (centered in scene)
	const bubbleWidthFull = bubbleWidth ?? 358;
	const bubbleWidthSmall = 84;
	const bubbleLeft = (SCENE_W - bubbleWidthFull) / 2;
	const bubbleTop = 40;
	const avatarLeft = bubbleLeft - 16 - 48;

	// Estimate bubble height: text top-padding + wrapped lines + attachment (4px pad + card + 4px pad)
	const textAreaW = bubbleWidthFull - 32;
	const textLines = Math.max(1, Math.ceil(message.length / Math.floor(textAreaW / 8.5)));
	const bubbleH = 12 + textLines * 26 + 8 + topSize.h;

	const TYPING_H = 48;
	// Tail and avatar anchored at the bottom of the full bubble — never move
	const tailTop = bubbleTop + bubbleH - 12;
	const avatarTop = bubbleTop + bubbleH - 48;
	// Typing bubble starts at the same bottom edge, expands right and up
	const bubbleTopPhase1 = bubbleTop + bubbleH - TYPING_H;
	const bubbleTopPhase2 = bubbleTop;


	const showPhase3 = (phase >= 3) || !hasChat;

	return (
		<div className={`explainerWrapper animation channel-${channelId}`}>
			<div className="esScene">

				{/* ── Phase 1 & 2: chat group ── */}
				<AnimatePresence>
					{hasChat && (phase === 1 || phase === 2) && (
						<motion.div
							key="chatGroup"
							className="esChatGroup"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0, y: -14 }}
							transition={phase === 1 ? EASE_OUT : { duration: 0.3, ease: 'easeIn' }}
						>
							{/* Avatar — fixed at final position, never moves */}
							<motion.div
								className="esChatAvatar"
								style={{ left: avatarLeft, top: avatarTop }}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={EASE_OUT}
							/>

							{/* Tail — fixed at final position, never moves */}
							<motion.div
								className="esChatTail"
								style={{ left: bubbleLeft, top: tailTop }}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={EASE_OUT}
							/>

							{/* Bubble — starts at bottom (aligned with tail), expands right and up */}
							<motion.div
								className="esChatBubble"
								style={{ left: bubbleLeft }}
								initial={{ top: bubbleTopPhase1, opacity: 0, width: bubbleWidthSmall, height: TYPING_H }}
								animate={{
									top: phase === 1 ? bubbleTopPhase1 : bubbleTopPhase2,
									width: phase === 1 ? bubbleWidthSmall : bubbleWidthFull,
									height: phase === 1 ? TYPING_H : bubbleH,
									opacity: 1,
								}}
								transition={{
									top: EASE_STANDARD,
									width: EASE_STANDARD,
									height: EASE_STANDARD,
									opacity: { duration: 0.3 },
								}}
							>

								<AnimatePresence mode="wait">
									{phase === 1 && (
										<motion.div
											key="dots"
											className="esBubbleDotsWrap"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.18, ease: 'easeOut' }}
										>
											<TypingDots />
										</motion.div>
									)}

									{phase === 2 && (
										<motion.div
											key="content"
											className="esBubbleContent"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ duration: 0.35, delay: 0.08 }}
										>
											<div className="esMessage">{message}</div>
											<motion.div
												layoutId="topCard"
												className="esAttachment"
												initial={{ scale: 0.94, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												transition={{ duration: 0.4, delay: 0.2, ease: [ 0, 0, 0.2, 1 ] as [ number, number, number, number ] }}
											>
												{renderCardContent(topContent)}
											</motion.div>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* ── Phase 3: graph scene ── */}
				<AnimatePresence>
					{showPhase3 && (
						<motion.div
							key="graphScene"
							className="esGraph"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.4 }}
						>
							{/* SVG connector lines */}
							<svg
								className="esConnectors"
								viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
								preserveAspectRatio="none"
							>
								<motion.line
									x1={lineOriginX} y1={lineOriginY}
									x2={lineTopX} y2={lineTopY}
									stroke="var(--color-shape-secondary)"
									strokeWidth={1}
									strokeLinecap="round"
									strokeDasharray={lineLenTop}
									initial={{ strokeDashoffset: lineLenTop }}
									animate={{ strokeDashoffset: 0 }}
									transition={{ duration: 0.6, delay: 0.15, ease: 'easeInOut' }}
								/>
								<motion.line
									x1={lineOriginX} y1={lineOriginY}
									x2={lineAX} y2={lineAY}
									stroke="var(--color-shape-secondary)"
									strokeWidth={1}
									strokeLinecap="round"
									strokeDasharray={lineLenA}
									initial={{ strokeDashoffset: lineLenA }}
									animate={{ strokeDashoffset: 0 }}
									transition={{ duration: 0.6, delay: 0.3, ease: 'easeInOut' }}
								/>
								<motion.line
									x1={lineOriginX} y1={lineOriginY}
									x2={lineBX} y2={lineBY}
									stroke="var(--color-shape-secondary)"
									strokeWidth={1}
									strokeLinecap="round"
									strokeDasharray={lineLenB}
									initial={{ strokeDashoffset: lineLenB }}
									animate={{ strokeDashoffset: 0 }}
									transition={{ duration: 0.6, delay: 0.45, ease: 'easeInOut' }}
								/>
							</svg>

							{/* Top card */}
							<motion.div
								layoutId="topCard"
								className="esTopCard"
								style={{ left: topLeft, top: topTop }}
								initial={!hasChat ? { opacity: 0, y: 10 } : undefined}
								animate={{ opacity: 1, y: 0 }}
								transition={SPRING}
							>
								{renderCardContent(topContent)}
							</motion.div>

							{/* Link cards */}
							<motion.div
								className="esLinkCard"
								style={{ left: linkALeft, top: linkATop }}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ ...SPRING_CARD, delay: 0.5 }}
							>
								{renderCardContent(linkA)}
							</motion.div>

							<motion.div
								className="esLinkCard"
								style={{ left: linkBLeft, top: linkBTop }}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ ...SPRING_CARD, delay: 0.65 }}
							>
								{renderCardContent(linkB)}
							</motion.div>

							{/* Intro labels */}
							<motion.div
								className="esIntro"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.5, delay: 0.2 }}
							>
								<Label className="line1" text={translate('authOnboardExplainerTitle1')} />
								<Label className="line2" text={translate('authOnboardExplainerTitle2')} />
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>

			</div>
		</div>
	);
};

export default ExplainerScene;
