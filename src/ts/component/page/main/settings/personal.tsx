import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Select, Switch, Icon } from 'Component';
import { I, S, U, translate, Action, analytics, Renderer } from 'Lib';

const PageMainSettingsPersonal = observer(class PageMainSettingsPersonal extends React.Component<I.PopupSettings> {

	render () {
		const { getId } = this.props;
		const { config, interfaceLang, linkStyle, fullscreenObject, hideSidebar, showRelativeDates, showVault, dateFormat, timeFormat, } = S.Common;
		const { hideTray, hideMenuBar, languages } = config;

		const canHideMenu = U.Common.isPlatformWindows() || U.Common.isPlatformLinux();
		const interfaceLanguages = U.Menu.getInterfaceLanguages();
		const spellingLanguages = U.Menu.getSpellingLanguages();
		const linkStyles: I.Option[] = [
			{ id: I.LinkCardStyle.Card, name: translate('menuBlockLinkSettingsStyleCard') },
			{ id: I.LinkCardStyle.Text, name: translate('menuBlockLinkSettingsStyleText') },
		];
		const sidebarMode = showVault ? translate('sidebarMenuAll') : translate('sidebarMenuSidebar');

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsPersonalTitle')} />

				<Label className="section" text={translate('popupSettingsPersonalSectionLanguage')} />

				<div className="actionItems">

					<div className="item">
						<Label text={translate('popupSettingsPersonalSpellcheckLanguage')} />

						<Select
							id="spellcheck"
							value={languages}
							options={spellingLanguages}
							onChange={v => Action.setSpellingLang(v)}
							arrowClassName="black"
							isMultiple={true}
							noFilter={false}
							menuParam={{ horizontal: I.MenuDirection.Right, width: 300 }}
						/>
					</div>

					<div className="item">
						<Label text={translate('popupSettingsPersonalInterfaceLanguage')} />

						<Select
							id="interfaceLang"
							value={interfaceLang}
							options={interfaceLanguages}
							onChange={v => Action.setInterfaceLang(v)}
							arrowClassName="black"
							menuParam={{ horizontal: I.MenuDirection.Right, width: 300 }}
						/>
					</div>
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
							<Icon className="arrow light" />
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
							<Switch className="big" value={!hideMenuBar} onChange={(e: any, v: boolean) => Renderer.send('setMenuBarVisibility', v)} />
						</div>
					) : ''}
				</div>

				<Label className="section" text={translate('popupSettingsPersonalSectionDateTime')} />

				<div className="actionItems">

					<div className="item">
						<Label text={translate('popupSettingsPersonalRelativeDates')} />
						<Switch
							className="big"
							value={showRelativeDates}
							onChange={(e: any, v: boolean) => {
								S.Common.showRelativeDatesSet(v);
								analytics.event('RelativeDates', { type: v });
							}}
						/>
					</div>

					<div className="item">
						<Label text={translate('popupSettingsPersonalDateFormat')} />
						<Select
							id="dateFormat"
							value={String(dateFormat)}
							options={U.Menu.dateFormatOptions()}
							onChange={v => {
								S.Common.dateFormatSet(v);
								analytics.event('ChangeDateFormat', { type: v });
							}}
							arrowClassName="black"
							menuParam={{ horizontal: I.MenuDirection.Right }}
						/>
					</div>

					<div className="item">
						<Label text={translate('popupSettingsPersonalTimeFormat')} />
						<Select
							id="timeFormat"
							value={String(timeFormat)}
							options={U.Menu.timeFormatOptions()}
							onChange={v => {
								S.Common.timeFormatSet(v);
								analytics.event('ChangeTimeFormat', { type: v });
							}}
							arrowClassName="black"
							menuParam={{ horizontal: I.MenuDirection.Right }}
						/>
					</div>

				</div>

			</React.Fragment>
		);
	};

});

export default PageMainSettingsPersonal;
