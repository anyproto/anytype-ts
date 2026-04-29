import React, { forwardRef } from 'react';
import { Title, Label, Select, Switch, Icon } from 'Component';
import * as I from 'Interface';

enum ChatKey {
	Enter 	 = 'enter',
	CmdEnter = 'cmdEnter',
};

const PageMainSettingsPersonal = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { config, linkStyle, fileStyle, fullscreenObject, hideSidebar, gridTitleClick, notificationSound, hideFileObjectsInTree, unicodeReplace } = S.Common;
	const { hideTray, showMenuBar, alwaysShowTabs, hardwareAcceleration } = config;
	const { theme, chatCmdSend, commentCmdSend } = S.Common;
	const cmd = keyboard.cmdSymbol();

	const onHardwareAccelerationChange = (v: boolean) => {
		S.Popup.open('confirm', {
			data: {
				title: translate('popupConfirmHardwareAccelerationTitle'),
				text: translate('popupConfirmHardwareAccelerationText'),
				textConfirm: translate('commonRestart'),
				textCancel: translate('commonCancel'),
				onConfirm: () => {
					Renderer.send('setHardwareAcceleration', v);
					Renderer.send('reload', '');
				},
			},
		});
	};

	const themes: any[] = [
		{ id: '', class: 'light', name: translate('pageSettingsColorModeButtonLight') },
		{ id: 'dark', class: 'dark', name: translate('pageSettingsColorModeButtonDark') },
		{ id: 'system', class: 'system', name: translate('pageSettingsColorModeButtonSystem') },
	];

	const canHideMenu = U.Common.isPlatformWindows() || U.Common.isPlatformLinux();
	const linkStyles: I.Option[] = [
		{ id: I.LinkDefaultStyle.Text, name: translate('popupSettingsPersonalLinkStyleText') },
		{ id: I.LinkDefaultStyle.Card, name: translate('popupSettingsPersonalLinkStyleCard') },
		{ id: I.LinkDefaultStyle.CardMedium, name: translate('popupSettingsPersonalLinkStyleCardMedium') },
	];
	const fileStyles: I.Option[] = [
		{ id: I.FileStyle.Embed, name: translate('blockNameEmbed') },
		{ id: I.FileStyle.Link, name: translate('blockNameLink') },
	];

	const chatKeys: I.Option[] = [
		{ id: ChatKey.Enter, name: 'Enter' },
		{ id: ChatKey.CmdEnter, name: `${cmd} + Enter` },
	];

	const notificationSounds: I.Option[] = [
		{ id: '', name: translate('popupSettingsPersonalNotificationSoundOff') },
		{ id: SYSTEM_SOUND_ID, name: translate('popupSettingsPersonalNotificationSoundSystem') },
		...Sound.list.map(it => ({ id: it.id, name: it.name })),
	];

	return (
		<>
			<Title text={translate('popupSettingsPersonalTitle')} />

			<Label className="section" text={translate('commonAppearance')} />

			<div className="colorScheme">
				{themes.map((item: any, i: number) => (
					<div
						key={i}
						className={[ 'btn', (theme == item.id ? 'active' : ''), item.class ].join(' ')}
						onClick={() => Action.themeSet(item.id)}
					>
						<div className="bg">
							<Icon />
							<div className="a" />
							<div className="b" />
							<div className="c" />
						</div>
						<Label className="left" text={item.name} />
					</div>
				))}
			</div>

			<div className="actionItems">
				<div className="item">
					<Label text={translate('popupSettingsPersonalNotificationSound')} />

					<Select
						id="notificationSound"
						value={notificationSound}
						options={notificationSounds}
						onChange={(v: string) => {
							S.Common.notificationSoundSet(v);

							if (v) {
								if (v == SYSTEM_SOUND_ID) {
									Renderer.send('notificationSound');
								} else {
									Sound.play(v);
								};
							};
						}}
						arrowClassName="black"
						menuParam={{ horizontal: I.MenuDirection.Right }}
					/>
				</div>

				<div className="item">
					<Label text={translate('electronMenuShowTray')} />
					<Switch
						className="big"
						value={!hideTray}
						onChange={(e: any, v: boolean) => {
							Renderer.send('setHideTray', v);
							analytics.event('ShowInSystemTray', { type: v });
						}}
					/>
				</div>
			</div>

			<Label className="section" text={translate('popupSettingsPersonalSectionInterface')} />

			<div className="actionItems">
				<div className="item">
					<Label text={translate('popupSettingsPersonalAlwaysShowTabbar')} />
					<Switch
						className="big"
						value={alwaysShowTabs}
						onChange={(e: any, v: boolean) => {
							Renderer.send('setAlwaysShowTabs', v);
							analytics.event(v ? 'ShowTabBar' : 'HideTabBar');
						}}
					/>
				</div>

				{canHideMenu ? (
					<div className="item">
						<Label text={translate('electronMenuShowMenu')} />
						<Switch
							className="big"
							value={showMenuBar}
							onChange={(e: any, v: boolean) => {
								Renderer.send('setMenuBarVisibility', v);
							}}
						/>
					</div>
				) : ''}

				<div className="item">
					<Label text={translate('popupSettingsPersonalSidebar')} />
					<Switch
						className="big"
						value={hideSidebar}
						onChange={(e: any, v: boolean) => {
							S.Common.hideSidebarSet(v);
							Renderer.send('setHideSidebar', v);
						}}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsPersonalHideFileObjectsInTree')} />
					<Switch
						className="big"
						value={hideFileObjectsInTree}
						onChange={(e: any, v: boolean) => S.Common.hideFileObjectsInTreeSet(v)}
					/>
				</div>
			</div>

			<Label className="section" text={translate('popupSettingsPersonalSectionContentViews')} />

			<div className="actionItems">
				<div className="item">
					<Label text={translate('popupSettingsPersonalFullscreen')} />
					<Switch
						className="big"
						value={fullscreenObject}
						onChange={(e: any, v: boolean) => {
							S.Common.fullscreenObjectSet(v);
							analytics.event('ShowObjectFullscreen', { type: v });
						}}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsPersonalLinkStyle')} />

					<Select
						id="linkStyle"
						value={String(linkStyle)}
						options={linkStyles}
						onChange={v => S.Common.linkStyleSet(v)}
						arrowClassName="black"
						menuParam={{ horizontal: I.MenuDirection.Right }}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsPersonalFileStyle')} />

					<Select
						id="fileStyle"
						value={String(fileStyle)}
						options={fileStyles}
						onChange={v => S.Common.fileStyleSet(v)}
						arrowClassName="black"
						menuParam={{ horizontal: I.MenuDirection.Right }}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsPersonalGridTitleClick')} />
					<Switch
						className="big"
						value={gridTitleClick}
						onChange={(e: any, v: boolean) => S.Common.gridTitleClickSet(v)}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsPersonalUnicodeReplace')} />
					<Switch
						className="big"
						value={unicodeReplace}
						onChange={(e: any, v: boolean) => S.Common.unicodeReplaceSet(v)}
					/>
				</div>
			</div>

			<Label className="section" text={translate('popupSettingsPersonalSectionMessaging')} />

			<div className="actionItems">
				<div className="item">
					<Label text={translate('popupSettingsPersonalChatSend')} />
					<Select
						id="chatSend"
						value={chatCmdSend ? ChatKey.CmdEnter : ChatKey.Enter}
						options={chatKeys}
						onChange={(v: string) => S.Common.chatCmdSendSet(v == ChatKey.CmdEnter)}
						menuParam={{ horizontal: I.MenuDirection.Right }}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsPersonalCommentSend')} />
					<Select
						id="commentSend"
						value={commentCmdSend ? ChatKey.CmdEnter : ChatKey.Enter}
						options={chatKeys}
						onChange={(v: string) => S.Common.commentCmdSendSet(v == ChatKey.CmdEnter)}
						menuParam={{ horizontal: I.MenuDirection.Right }}
					/>
				</div>
			</div>

			<Label className="section" text={translate('popupSettingsPersonalSectionAdvanced')} />

			<div className="actionItems">
				<div className="item">
					<Label text={translate('popupSettingsPersonalHardwareAcceleration')} />
					<Switch
						className="big"
						value={hardwareAcceleration !== false}
						onChange={(e: any, v: boolean) => onHardwareAccelerationChange(v)}
					/>
				</div>
			</div>
		</>
	);

});

export default PageMainSettingsPersonal;
