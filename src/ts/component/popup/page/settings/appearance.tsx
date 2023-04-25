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
			{ id: '', class: 'light', name: 'Light' },
			{ id: 'dark', class: 'dark', name: 'Dark' },
			{ id: 'system', class: 'system', name: 'System' },
		];

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsAppearanceTitle')} />

				<div className="rows">
					<Label className="section" text="Color mode" />

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

					<div className="rows">
						<div className="row">
							<div className="side left">
								<Label text="Automatically show and hide sidebar" />
							</div>
							<div className="side right">
								<Switch value={autoSidebar} className="big" onChange={(e: any, v: boolean) => { commonStore.autoSidebarSet(v); }}/>
							</div>
						</div>
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