import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Select, Switch } from 'Component';
import { I, translate, UtilMenu, Action } from 'Lib';
import { commonStore } from 'Store';

const PopupSettingsPagePersonal = observer(class PopupSettingsPagePersonal extends React.Component<I.PopupSettings> {

	constructor (props: I.PopupSettings) {
		super(props);
	};

	render () {
		const { config, interfaceLang, navigationMenu, fullscreenObject } = commonStore;
		const { languages } = config;
		const interfaceLanguages = UtilMenu.getInterfaceLanguages();
		const spellingLanguages = UtilMenu.getSpellingLanguages();
		const navigationMenuModes: I.Option[] = [
			{ id: I.NavigationMenuMode.Click, name: translate('popupSettingsPersonalNavigationMenuClick') },
			{ id: I.NavigationMenuMode.Hover, name: translate('popupSettingsPersonalNavigationMenuHover') },
			{ id: I.NavigationMenuMode.Context, name: translate('popupSettingsPersonalNavigationMenuContext') },
		];

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsPersonalTitle')} />

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
							menuParam={{ 
								horizontal: I.MenuDirection.Right, 
								width: 300,
								className: 'fixed',
							}}
						/>
					</div>

					{config.experimental ? (
						<div className="item">
							<Label text={translate('popupSettingsPersonalNavigationMenu')} />

							<Select
								id="navigationMenu"
								value={navigationMenu}
								options={navigationMenuModes}
								onChange={v => commonStore.navigationMenuSet(v)}
								arrowClassName="black"
								menuParam={{ 
									horizontal: I.MenuDirection.Right, 
									width: 300,
									className: 'fixed',
								}}
							/>
						</div>
					) : ''}

					<div className="item">
						<Label text={translate('popupSettingsPersonalFullscreen')} />
						<Switch className="big" value={fullscreenObject} onChange={(e: any, v: boolean) => commonStore.fullscreenObjectSet(v)} />
					</div>
				</div>

			</React.Fragment>
		);
	};

});

export default PopupSettingsPagePersonal;
