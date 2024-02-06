import * as React from 'react';
import { Icon, Title, Label, Switch, Select } from 'Component';
import { I, UtilCommon, translate, analytics, Renderer } from 'Lib';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';

const PopupSettingsPageAppearance = observer(class PopupSettingsPageAppearance extends React.Component<I.PopupSettings> {

	render () {
		const { autoSidebar, showRelativeDates, config, theme, fullscreenObject } = commonStore;
		const { hideTray, hideMenuBar } = config;
		const canHideMenu = UtilCommon.isPlatformWindows() || UtilCommon.isPlatformLinux();
		const themes: any[] = [
			{ id: '', class: 'light', name: translate('popupSettingsAppearanceColorModeButtonLight') },
			{ id: 'dark', class: 'dark', name: translate('popupSettingsAppearanceColorModeButtonDark') },
			{ id: 'system', class: 'system', name: translate('popupSettingsAppearanceColorModeButtonSystem') },
		];

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsAppearanceTitle')} />

				<Label className="section" text={translate('popupSettingsAppearanceColorMode')} />

				<div className="buttons">
					{themes.map((item: any, i: number) => (
						<div
							key={i}
							className={[ 'btn', (theme == item.id ? 'active' : ''), item.class ].join(' ')}
							onClick={() => this.onTheme(item.id)}
						>
							<div className="bg">
								<Icon />
							</div>
							<Label text={item.name} />
						</div>
					))}
				</div>

				<Label className="section" text={translate('popupSettingsAppearancePersonalisation')} />

				<div className="actionItems">
					<div className="item">
						<Label text={translate('popupSettingsAppearancePersonalisationSidebar')} />
						<Switch className="big" value={autoSidebar} onChange={(e: any, v: boolean) => commonStore.autoSidebarSet(v)} />
					</div>

					<div className="item">
						<Label text={translate('electronMenuShowTray')} />
						<Switch className="big" value={!hideTray} onChange={(e: any, v: boolean) => Renderer.send('setHideTray', v)} />
					</div>

					<div className="item">
						<Label text={translate('popupSettingsAppearancePersonalisationRelativeDates')} />
						<Switch className="big" value={showRelativeDates} onChange={(e: any, v: boolean) => commonStore.showRelativeDatesSet(v)} />
					</div>

					{canHideMenu ? (
						<div className="item">
							<Label text={translate('electronMenuShowMenu')} />
							<Switch className="big" value={!hideMenuBar} onChange={(e: any, v: boolean) => Renderer.send('setMenuBarVisibility', v)} />
						</div>
					) : ''}

					<div className="item">
						<Label text={translate('popupSettingsAppearancePersonalisationFullscreen')} />
						<Switch className="big" value={fullscreenObject} onChange={(e: any, v: boolean) => commonStore.fullscreenObjectSet(v)} />
					</div>
				</div>
			</React.Fragment>
		);
	};

	onTheme (id: string) {
		commonStore.themeSet(id);
		Renderer.send('setTheme', id);
		analytics.event('ThemeSet', { id });
	};

});

export default PopupSettingsPageAppearance;