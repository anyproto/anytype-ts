import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Select, Switch, Icon } from 'Component';
import { I, S, U, translate, Action, analytics, Renderer, keyboard, } from 'Lib';

enum ChatKey {
	Enter 	 = 'enter',
	CmdEnter = 'cmdEnter',
};

const PageMainSettingsPersonal = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { config, linkStyle, fileStyle, fullscreenObject, hideSidebar, vaultMessages } = S.Common;
	const { hideTray, showMenuBar, alwaysShowTabs, hardwareAcceleration } = config;
	const { theme, chatCmdSend } = S.Common;
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

	const vaultStyles: I.Option[] = [
		{ id: 0, name: translate('popupSettingsVaultCompact') },
		{ id: 1, name: translate('popupSettingsVaultWithMessages') },
	];

	const canHideMenu = U.Common.isPlatformWindows() || U.Common.isPlatformLinux();
	const linkStyles: I.Option[] = [
		{ id: I.LinkCardStyle.Card, name: translate('menuBlockLinkSettingsStyleCard') },
		{ id: I.LinkCardStyle.Text, name: translate('menuBlockLinkSettingsStyleText') },
	];
	const fileStyles: I.Option[] = [
		{ id: I.FileStyle.Embed, name: translate('blockNameEmbed') },
		{ id: I.FileStyle.Link, name: translate('blockNameLink') },
	];

	const chatKeys: I.Option[] = [
		{ id: ChatKey.Enter, name: 'Enter' },
		{ id: ChatKey.CmdEnter, name: `${cmd} + Enter` },
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

			<Label className="section" text={translate('popupSettingsPersonalSectionApp')} />

			<div className="actionItems">
				<div className="item">
					<Label text={translate('popupSettingsPersonalVaultStyle')} />

					<Select
						id="vaultMessages"
						value={String(Number(vaultMessages))}
						options={vaultStyles}
						onChange={v => S.Common.vaultMessagesSet(Boolean(Number(v)))}
						arrowClassName="black"
						menuParam={{ horizontal: I.MenuDirection.Right }}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsPersonalSidebar')} />
					<Switch className="big" value={hideSidebar} onChange={(e: any, v: boolean) => S.Common.hideSidebarSet(v)} />
				</div>

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
			</div>

			<Label className="section" text={translate('popupSettingsPersonalSectionChat')} />

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
			</div>

			<Label className="section" text={translate('popupSettingsPersonalSectionEditor')} />

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

}));

export default PageMainSettingsPersonal;
