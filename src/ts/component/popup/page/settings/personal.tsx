import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Select, Switch } from 'Component';
import { I, S, U, translate, Action, analytics } from 'Lib';

const PopupSettingsPagePersonal = observer(class PopupSettingsPagePersonal extends React.Component<I.PopupSettings> {

	constructor (props: I.PopupSettings) {
		super(props);
	};

	render () {
		const { config, interfaceLang, navigationMenu, linkStyle, fullscreenObject, autoSidebar } = S.Common;
		const { languages } = config;
		const interfaceLanguages = U.Menu.getInterfaceLanguages();
		const spellingLanguages = U.Menu.getSpellingLanguages();
		const navigationMenuModes: I.Option[] = [
			{ id: I.NavigationMenuMode.Click, name: translate('popupSettingsPersonalNavigationMenuClick') },
			{ id: I.NavigationMenuMode.Hover, name: translate('popupSettingsPersonalNavigationMenuHover') },
			{ id: I.NavigationMenuMode.Context, name: translate('popupSettingsPersonalNavigationMenuContext') },
		];
		const linkStyles: I.Option[] = [
			{ id: I.LinkCardStyle.Card, name: translate('menuBlockLinkSettingsStyleCard') },
			{ id: I.LinkCardStyle.Text, name: translate('menuBlockLinkSettingsStyleText') },
		].map(it => ({ ...it, id: String(it.id) }));

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
							menuParam={{ horizontal: I.MenuDirection.Right, width: 300 }}
						/>
					</div>

					<div className="item">
						<Label text={translate('popupSettingsPersonalNavigationMenu')} />

						<Select
							id="navigationMenu"
							value={navigationMenu}
							options={navigationMenuModes}
							onChange={v => {
								S.Common.navigationMenuSet(v);
								analytics.event('ChangeShowQuickCapture', { type: v });
							}}
							arrowClassName="black"
							menuParam={{ horizontal: I.MenuDirection.Right }}
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
						<Label text={translate('popupSettingsPersonalFullscreen')} />
						<Switch className="big" value={fullscreenObject} onChange={(e: any, v: boolean) => S.Common.fullscreenObjectSet(v)} />
					</div>

					<div className="item">
						<Label text={translate('popupSettingsAppearancePersonalisationSidebar')} />
						<Switch className="big" value={autoSidebar} onChange={(e: any, v: boolean) => S.Common.autoSidebarSet(v)} />
					</div>
				</div>

			</React.Fragment>
		);
	};

});

export default PopupSettingsPagePersonal;
