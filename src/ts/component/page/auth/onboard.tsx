import React, { forwardRef, useRef, useState, useEffect, useLayoutEffect, KeyboardEvent } from 'react';
import { Frame, Title, Label, Button, Icon, Input, Error, Header, Phrase, Footer, IconObject, QR } from 'Component';
import * as I from 'Interface';
import Animation from 'Lib/animation';
import ExplainerScene from './explainerScene';

enum Stage {
	ChannelType		= 0,
	Explainer		= 1,
	Profile			= 2,
	ProfileShare	= 3,
	Key				= 4,
	Email			= 5,
};

const CHANNELS = [
	{ id: 'team', hasChat: true, bubbleWidth: 358 },
	{ id: 'friends', hasChat: true, bubbleWidth: 456 },
	{ id: 'community', hasChat: true, bubbleWidth: 456 },
	{ id: 'private', hasChat: false, bubbleWidth: 358 },
];

const PageAuthOnboard = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { account } = S.Auth;
	const nodeRef = useRef(null);
	const frameRef = useRef(null);
	const nextRef = useRef(null);
	const phraseRef = useRef(null);
	const emailRef = useRef(null);
	const nameRef = useRef(null);
	const descriptionRef = useRef(null);
	const selectedRef = useRef('');
	const shareLinkRef = useRef('');
	const connectTimeouts = useRef<number[]>([]);
	const [ stage, setStage ] = useState(Stage.ChannelType);
	const [ phraseVisible, setPhraseVisible ] = useState(false);
	const [ explainerPhase, setExplainerPhase ] = useState(0);
	const [ error, setError ] = useState('');
	const [ dummy, setDummy ] = useState(0);
	const cnb = [];
	const needEmail = U.Data.isAnytypeNetwork() && S.Common.isOnline;
	const lastStage = needEmail ? Stage.Email : Stage.Key;

	const onKeyDownRef = useRef<((e: any) => void) | null>(null);

	const unbind = () => {
		if (onKeyDownRef.current) {
			U.Dom.removeEvent(window, 'keydown', onKeyDownRef.current);
			onKeyDownRef.current = null;
		};
	};

	const rebind = () => {
		unbind();

		const handler = e => {
			keyboard.shortcut('enter', e, () => {
				e.preventDefault();
				onForward();
			});
		};

		onKeyDownRef.current = handler;
		U.Dom.addEvent(window, 'keydown', handler);
	};

	// Guard to prevent illegal state change
	const canMoveForward = (): boolean => {
		if (nextRef.current?.isLoading()) {
			return false;
		};
		if ((stage == Stage.ChannelType) && !selectedRef.current) {
			return false;
		};
		return stage <= lastStage;
	};

	// Guard to prevent illegal state change
	const canMoveBack = (): boolean => {
		return stage <= lastStage;
	};

	const onAuth = () => {
		U.Router.switchSpace(S.Common.space, '', false, {
			onRouteChange: () => {
				Onboarding.startCommon(props.isPopup);
				analytics.event('OpenAccount');
			},
		}, false);
	};

	const isJustMe = () => selectedRef.current == 'private';

	// Just-me users skip Profile + ProfileShare and go straight from Explainer to Key.
	const nextStage = (s: Stage): Stage => {
		if (isJustMe() && (s == Stage.Explainer)) {
			return Stage.Key;
		};
		return s + 1;
	};

	const prevStage = (s: Stage): Stage => {
		if (isJustMe() && (s == Stage.Key)) {
			return Stage.Explainer;
		};
		return s - 1;
	};

	// Moves the Onboarding Flow one stage forward if possible
	const onForward = (skip?: boolean) => {
		if (!canMoveForward()) {
			return;
		};

		setError('');

		switch (stage) {
			case Stage.ChannelType: {
				Animation.from(() => setStage(nextStage(stage)));

				analytics.event('ClickOnboarding', { step: 'Channel', type: U.String.toUpperCamelCase(selectedRef.current) });
				break;
			};

			case Stage.Explainer: {
				Animation.from(() => setStage(nextStage(stage)));
				break;
			};

			case Stage.Profile: {
				saveProfile();
				Animation.from(() => setStage(nextStage(stage)));

				analytics.event('ClickOnboarding', { step: 'Profile' });
				break;
			};

			case Stage.ProfileShare: {
				Animation.from(() => setStage(nextStage(stage)));
				break;
			};

			case Stage.Key: {
				if (needEmail) {
					Animation.from(() => setStage(nextStage(stage)));
				} else {
					onAuth();
				};
				break;
			};

			case Stage.Email: {
				if (skip) {
					onAuth();
					analytics.event('ScreenOnboardingSkipEmail');
					break;
				};

				const email = emailRef.current?.getValue();

				if (email) {
					nextRef.current?.setLoading(true);

					C.MembershipV2SubscribeToUpdates(email, (message: any) => {
						nextRef.current?.setLoading(false);

						if (message.error.code) {
							setError(message.error.description);
							return;
						};

						analytics.event('ScreenOnboardingEnterEmail', { middleTime: message.middleTime });
						onAuth();
					});
				} else {
					analytics.event('ScreenOnboardingSkipEmail');
					onAuth();
				};
				break;
			};
		};
	};

	// Moves the Onboarding Flow one stage backward, or exits it entirely
	const onBack = () => {
		if (!canMoveBack()) {
			return;
		};

		if (stage == Stage.ChannelType) {
			Animation.from(() => U.Router.go('/auth/select', { replace: true }));
		} else {
			setStage(prevStage(stage));
		};
	};

	const saveProfile = () => {
		const profile = U.Space.getProfile();
		const name = nameRef.current?.getValue();
		const description = descriptionRef.current?.getValue();
		const details = [];

		if ((name !== undefined) && (profile.name != name)) {
			details.push({ key: 'name', value: String(name || '') });
		};
		if ((description !== undefined) && (profile.description != description)) {
			details.push({ key: 'description', value: String(description || '') });
		};

		if (details.length) {
			C.ObjectListSetDetails([ S.Block.profile ], details);
		};
	};

	const loadShareLink = () => {
		if (shareLinkRef.current) {
			setDummy(dummy + 1);
			return;
		};

		const spaceId = S.Common.space;
		const setLink = (cid: string, key: string) => {
			if (!cid || !key) {
				return;
			};

			shareLinkRef.current = U.Space.getInviteLink(cid, key);
			setDummy(dummy + 1);
		};

		// Reuse the current space invite if it already exists, otherwise generate one.
		U.Space.getInvite(spaceId, (cid: string, key: string) => {
			if (cid && key) {
				setLink(cid, key);
				return;
			};

			C.SpaceMakeShareable(spaceId, (message: any) => {
				if (message.error.code && message.error.code != 104) {
					return;
				};

				C.SpaceInviteGenerate(spaceId, I.InviteType.WithoutApprove, I.ParticipantPermissions.Reader, (message: any) => {
					if (message.error.code) {
						return;
					};

					setLink(message.inviteCid, message.inviteKey);
				});
			});
		});
	};

	const onPhraseCopy = () => {
		if (!phraseVisible) {
			phraseRef.current?.onToggle();
			setPhraseVisible(true);
		};

		U.Common.copyToast(translate('commonPhrase'), phraseRef.current?.getValue());
		analytics.event('KeychainCopy', { type: 'Onboarding' });
	};

	const onLearnMore = () => {
		S.Popup.open('phrase', {});
		analytics.event('ClickOnboarding', { type: 'MoreInfo', step: Stage[stage] });
	};

	const onEmailKeyUp = (e: KeyboardEvent, v: string) => {
		const isValid = U.String.matchEmail(v);

		U.Dom.toggleClass(nextRef.current?.getNode(), 'disabled', !isValid);
	};

	const onChannelClick = (id: string) => {
		selectedRef.current = id;
		setDummy(dummy + 1);
	};

	const onCopyLink = () => {
		if (!shareLinkRef.current) {
			return;
		};

		U.Common.copyToast(translate('authOnboardConnectShareTitle'), shareLinkRef.current);
		analytics.event('ClickOnboarding', { step: 'ProfileShare', type: 'CopyLink' });
	};

	const onProfilePicClick = () => {
		Action.openFileDialog({ extensions: J.Constant.fileExtension.cover }, (paths: string[]) => {
			if (!paths.length) {
				return;
			};

			C.FileUpload(S.Common.space, '', paths[0], I.FileType.Image, {}, false, '', I.ImageKind.Icon, S.Block.profile, 'iconImage', (message: any) => {
				if (!message.error.code && message.objectId) {
					U.Object.setIcon(S.Block.profile, '', message.objectId);
				};
			});
		});
	};

	const onDownloadQr = () => {
		const canvas = U.Dom.select('canvas', nodeRef.current) as HTMLCanvasElement;
		if (!canvas) {
			return;
		};

		const image = canvas.toDataURL('image/png');
		if (image) {
			Renderer.send('download', image, { saveAs: true });
			analytics.event('ClickOnboarding', { step: 'ProfileShare', type: 'Download' });
		};
	};

	const getChannel = () => CHANNELS.find(it => it.id == selectedRef.current) || CHANNELS[0];

	const getExplainerContent = (id: string) => {
		const t = (k: string) => translate(`authOnboardExplainer${U.String.toUpperCamelCase(id)}${k}`);

		switch (id) {
			case 'team':
				return {
					top: { kind: 'compact', icon: '🍭', name: t('TopName'), type: t('TopType') },
					a: { kind: 'person', avatar: 'userAvatar', name: t('AName'), type: t('AType') },
					b: { kind: 'task', name: t('BName'), type: t('BType'), desc: t('BDesc') },
				};
			case 'friends':
				return {
					top: { kind: 'bookmark', source: t('TopSource'), name: t('TopName'), desc: t('TopDesc'), img: 'lisbon' },
					a: { kind: 'country', flag: 'portugal', name: t('AName'), type: t('AType') },
					b: { kind: 'task', icon: 'page', name: t('BName'), type: t('BType'), desc: t('BDesc') },
				};
			case 'community':
				return {
					top: { kind: 'bookmark', source: t('TopSource'), name: t('TopName'), desc: t('TopDesc'), img: 'opensource' },
					a: { kind: 'video', thumb: 'videoAvatar', name: t('AName'), type: t('AType') },
					b: { kind: 'task', icon: '🏠', name: t('BName'), type: t('BType'), desc: t('BDesc') },
				};
			default:
				return {
					top: { kind: 'compact', icon: '🍿', name: t('TopName'), type: t('TopType') },
					a: { kind: 'bookmark', source: t('ASource'), name: t('AName'), desc: t('ADesc'), img: 'duneBookmark' },
					b: { kind: 'cover', img: 'duneCover', name: t('BName'), type: t('BType') },
				};
		};
	};

	const renderExplainer = () => {
		const channel = getChannel();
		const content = getExplainerContent(channel.id);
		const message = translate(`authOnboardExplainer${U.String.toUpperCamelCase(channel.id)}Message`);

		return (
			<ExplainerScene
				channelId={channel.id}
				hasChat={channel.hasChat}
				bubbleWidth={channel.bubbleWidth}
				message={message}
				topContent={content.top}
				linkA={content.a}
				linkB={content.b}
				phase={explainerPhase}
			/>
		);
	};

	if (!canMoveForward()) {
		cnb.push('disabled');
	};

	let title = null;
	let content = null;
	let additional = null;
	let buttons = null;
	let footer = null;

	switch (stage) {
		case Stage.ChannelType: {
			title = (
				<div className="intro animation">
					<Label className="line1" text={translate('authOnboardChannelTitle')} />
					<Label className="line2" text={translate('authOnboardChannelLabel')} />
				</div>
			);

			content = (
				<div className="channelsWrapper animation">
					{CHANNELS.map(it => {
						const u = U.String.toUpperCamelCase(it.id);
						const cn = [ 'channel', it.id, (selectedRef.current == it.id ? 'selected' : '') ];

						return (
							<div className={cn.join(' ')} key={it.id} onClick={() => onChannelClick(it.id)}>
								<div className="channelBg" />
								<Icon className={`channelIcon ${it.id}`} />
								<div className="text">
									<div className="name">{translate(`authOnboardChannel${u}Name`)}</div>
									<div className="description">{translate(`authOnboardChannel${u}Description`)}</div>
								</div>
								{selectedRef.current == it.id ? <Icon className="check" /> : ''}
							</div>
						);
					})}
				</div>
			);

			buttons = (
				<div className="animation">
					<Button ref={nextRef} size={48} className={cnb.join(' ')} text={translate('commonContinue')} color="accent" onClick={() => onForward()} />
				</div>
			);
			break;
		};

		case Stage.Explainer: {
			content = renderExplainer();

			buttons = (
				<div className="animation">
					<Button ref={nextRef} size={48} className={cnb.join(' ')} text={translate('commonContinue')} color="accent" onClick={() => onForward()} />
				</div>
			);
			break;
		};

		case Stage.Profile: {
			const profile = U.Space.getProfile();

			let name = profile.name;
			if (name == translate('defaultNamePage')) {
				name = '';
			};

			title = (
				<>
					<Title className="animation" text={translate('authOnboardProfileTitle')} />
					<Label id="label" className="description animation" text={translate('authOnboardProfileLabel')} />
				</>
			);

			content = (
				<div className="profileWrapper animation">
					<div className="iconWrapper" onClick={onProfilePicClick}>
						<IconObject
							id="onboard-userpic"
							object={profile}
							size={128}
						/>
						<Icon className="edit" />
					</div>

					<div className="inputWrapper">
						<Input
							ref={nameRef}
							value={name}
							placeholder={translate('authOnboardProfileNamePlaceholder')}
							maxLength={160}
							focusOnMount={true}
						/>
					</div>

					<div className="inputWrapper">
						<Input
							ref={descriptionRef}
							value={profile.description}
							placeholder={translate('authOnboardProfileDescriptionPlaceholder')}
							maxLength={160}
						/>
					</div>
				</div>
			);

			buttons = (
				<div className="animation">
					<Button ref={nextRef} size={48} text={translate('commonContinue')} color="accent" onClick={() => onForward()} />
				</div>
			);
			break;
		};

		case Stage.ProfileShare: {
			const profile = U.Space.getProfile();
			const hasLink = !!shareLinkRef.current;
			const actionCn = (extra: string) => [ 'action', extra, (hasLink ? '' : 'disabled') ].join(' ');

			title = (
				<>
					<Title className="animation" text={translate('authOnboardConnectTitle')} />
					<Label id="label" className="description animation" text={translate('authOnboardConnectLabel')} />
				</>
			);

			content = (
				<div className="shareWrapper animation">
					<div className="shareCard">
						<Label className="shareTitle" text={translate('authOnboardConnectShareTitle')} />

						<div className="qrWrap">
							{hasLink ? (
								<QR
									value={shareLinkRef.current}
									size={170}
									level="H"
								/>
							) : <div className="qrPlaceholder" />}
							<div className="qrHole" />
							<div className="avatar">
								<IconObject object={profile} size={64} />
							</div>
						</div>

						<div className="profileName">{profile.name}</div>

						<div className="actions">
							<div className={actionCn('copy')} onClick={onCopyLink}>
								<Icon className="copyLink" />
								<Label text={translate('authOnboardConnectCopyLink')} />
							</div>
							<div className={actionCn('download')} onClick={onDownloadQr}>
								<Icon className="downloadQr" />
								<Label text={translate('authOnboardConnectDownload')} />
							</div>
						</div>
					</div>
				</div>
			);

			buttons = (
				<div className="animation">
					<Button ref={nextRef} size={48} text={translate('commonContinue')} color="accent" onClick={() => onForward()} />
				</div>
			);
			break;
		};

		case Stage.Key: {
			title = (
				<>
					<Title className="animation" text={translate('authOnboardPhraseTitle')} />
					<Label id="label" className="description animation" text={translate('authOnboardPhraseLabel')} />
				</>
			);

			additional = (
				<div className="learnMore animation" onClick={onLearnMore}>
					<Icon name="plus/onboarding" size={18} />
					<Label text={translate('commonLearnMore')} />
				</div>
			);

			content = (
				<Phrase
					ref={phraseRef}
					className="animation"
					isHidden={!phraseVisible}
					onCopy={onPhraseCopy}
					onClick={onPhraseCopy}
					readonly={true}
					tooltipCopy={translate('pageAuthOnboardCopyKey')}
				/>
			);

			buttons = (
				<>
					<div className="animation">
						<Button
							ref={nextRef}
							size={48}
							text={phraseVisible ? translate('authOnboardPhraseSaved') : translate('authOnboardPhraseRevealAndCopy')}
							color="accent"
							onClick={phraseVisible ? () => onForward() : onPhraseCopy}
						/>
					</div>

					<div className="animation">
						<Button color="blank" size={48} text={translate('authOnboardPhraseLater')} onClick={() => onForward()} />
					</div>
				</>
			);
			break;
		};

		case Stage.Email: {
			cnb.push('disabled');

			title = (
				<>
					<Title className="animation" text={translate('authOnboardEmailTitle')} />
					<Label id="label" className="description animation" text={translate('authOnboardEmailLabel')} />
				</>
			);

			content = (
				<div className="inputWrapper animation">
					<Input
						key="email"
						ref={emailRef}
						focusOnMount={true}
						placeholder={translate('authOnboardEmailPlaceholder')}
						maxLength={255}
						onKeyUp={onEmailKeyUp}
					/>
				</div>
			);

			buttons = (
				<>
					<div className="animation">
						<Button ref={nextRef} size={48} className={cnb.join(' ')} text={translate('commonContinue')} color="accent" onClick={() => onForward()} />
					</div>
					<div className="animation">
						<Button color="blank" size={48} text={translate('commonSkip')} onClick={() => onForward(true)} />
					</div>
				</>
			);

			footer = <Footer {...props} component="authOnboardEmail" />;
			break;
		};
	};

	const init = () => {
		Animation.to();
		frameRef.current?.resize();
		rebind();
	};

	useEffect(() => {
		init();
		return () => {
			unbind();
			connectTimeouts.current.forEach(t => window.clearTimeout(t));
		};
	}, []);

	useLayoutEffect(() => {
		if (stage == Stage.Explainer) {
			setExplainerPhase(0);
		};
	}, [ stage ]);

	useEffect(() => {
		init();

		if (account && (stage == Stage.Key)) {
			Renderer.send('keytarGet', account.id).then((value: string) => {
				if (value) {
					phraseRef.current?.setValue(value);
				};
			}).catch((err: any) => {
				console.error('[Onboard] Error retrieving phrase from keychain:', err);
			});
		};

		if (stage == Stage.Explainer) {
			connectTimeouts.current.forEach(t => window.clearTimeout(t));
			connectTimeouts.current = [];

			if (getChannel().hasChat) {
				setExplainerPhase(1);
				connectTimeouts.current.push(window.setTimeout(() => setExplainerPhase(2), 1800));
				connectTimeouts.current.push(window.setTimeout(() => setExplainerPhase(3), 4300));
			} else {
				connectTimeouts.current.push(window.setTimeout(() => setExplainerPhase(3), 400));
			};
		};

		if (stage == Stage.ProfileShare) {
			loadShareLink();
		};

		analytics.event('ScreenOnboarding', { step: Stage[stage] });
		return () => unbind();
	}, [ stage ]);

	return (
		<div
			ref={nodeRef}
			className={`stage${Stage[stage]}`}
		>
			<div className="bubbleBg" />

			<Header {...props} component="authIndex" onBack={onBack} />

			<Frame ref={frameRef}>
				{title}
				{additional}

				{content}
				<Error className="animation" text={error} />
				<div className="buttons">{buttons}</div>
			</Frame>

			{footer}
		</div>
	);

});

export default PageAuthOnboard;
