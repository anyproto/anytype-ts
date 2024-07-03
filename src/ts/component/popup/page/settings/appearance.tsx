import * as React from 'react';
import { Icon, Title, Label, Switch } from 'Component';
import { I, S, U, translate, analytics, Renderer } from 'Lib';
import { observer } from 'mobx-react';

const PopupSettingsPageAppearance = observer(class PopupSettingsPageAppearance extends React.Component<I.PopupSettings> {

	render () {
		const { showRelativeDates, config, theme } = S.Common;
		const { hideTray, hideMenuBar } = config;
		const canHideMenu = U.Common.isPlatformWindows() || U.Common.isPlatformLinux();
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
						<Label text={translate('electronMenuShowTray')} />
						<Switch className="big" value={!hideTray} onChange={(e: any, v: boolean) => Renderer.send('setHideTray', v)} />
					</div>

					<div className="item">
						<Label text={translate('popupSettingsAppearancePersonalisationRelativeDates')} />
						<Switch className="big" value={showRelativeDates} onChange={(e: any, v: boolean) => S.Common.showRelativeDatesSet(v)} />
					</div>

					{canHideMenu ? (
						<div className="item">
							<Label text={translate('electronMenuShowMenu')} />
							<Switch className="big" value={!hideMenuBar} onChange={(e: any, v: boolean) => Renderer.send('setMenuBarVisibility', v)} />
						</div>
					) : ''}
				</div>
			</React.Fragment>
		);
	};

	onTheme (id: string) {
		S.Common.themeSet(id);
		Renderer.send('setTheme', id);
		analytics.event('ThemeSet', { id });
	};

});

export default PopupSettingsPageAppearance;