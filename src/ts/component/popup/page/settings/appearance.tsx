import * as React from 'react';
import { Icon, Title, Label, Switch } from 'Component';
import { I, translate, analytics, Renderer } from 'Lib';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';

const PopupSettingsPageAppearance = observer(class PopupSettingsPageAppearance extends React.Component<I.PopupSettings> {

	render () {
		const { autoSidebar } = commonStore;
		const { theme } = commonStore;
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
							onClick={() => { this.onTheme(item.id); }}
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

						<Switch className="big" value={autoSidebar} onChange={(e: any, v: boolean) => { commonStore.autoSidebarSet(v); }}/>
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