import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Select, Switch, Icon } from 'Component';
import { I, S, U, translate, Action, analytics, Renderer } from 'Lib';

const PageMainSettingsPersonal = observer(class PageMainSettingsPersonal extends React.Component<I.PageSettingsComponent> {

	render () {
		const { getId } = this.props;
		const { config, linkStyle, fullscreenObject, hideSidebar, showVault } = S.Common;
		const { hideTray, showMenuBar } = config;
		const { theme } = S.Common;

		const themes: any[] = [
			{ id: '', class: 'light', name: translate('pageSettingsColorModeButtonLight') },
			{ id: 'dark', class: 'dark', name: translate('pageSettingsColorModeButtonDark') },
			{ id: 'system', class: 'system', name: translate('pageSettingsColorModeButtonSystem') },
		];

		const canHideMenu = U.Common.isPlatformWindows() || U.Common.isPlatformLinux();
		const linkStyles: I.Option[] = [
			{ id: I.LinkCardStyle.Card, name: translate('menuBlockLinkSettingsStyleCard') },
			{ id: I.LinkCardStyle.Text, name: translate('menuBlockLinkSettingsStyleText') },
		];
		const sidebarMode = showVault ? translate('sidebarMenuAll') : translate('sidebarMenuSidebar');

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

				<Label className="section" text={translate('popupSettingsPersonalSectionEditor')} />

				<div className="actionItems">
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

				</div>

				<Label className="section" text={translate('popupSettingsPersonalSectionApp')} />

				<div className="actionItems">

					<div className="item">
						<Label text={translate('popupSettingsPersonalSidebar')} />
						<Switch className="big" value={hideSidebar} onChange={(e: any, v: boolean) => S.Common.hideSidebarSet(v)} />
					</div>

					<div className="item">
						<Label text={translate('popupSettingsPersonalSidebarMode')} />
						<div id="sidebarMode" className="select" onMouseDown={() => U.Menu.sidebarContext(`#${getId()} #sidebarMode`)}>
							<div className="item">
								<div className="name">{sidebarMode}</div>
							</div>
							<Icon className="arrow black" />
						</div>
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

			</>
		);
	};

});

export default PageMainSettingsPersonal;
