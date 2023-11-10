import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Select, Switch } from 'Component';
import { I, translate, UtilCommon, Action, Renderer } from 'Lib';
import { commonStore } from 'Store';
import Constant from 'json/constant.json';

const PopupSettingsPagePersonal = observer(class PopupSettingsPagePersonal extends React.Component<I.PopupSettings> {

	constructor (props: I.PopupSettings) {
		super(props);
	};

	render () {
		const { config, interfaceLang } = commonStore;
		const { languages, hideTray, hideMenuBar } = config;
		const interfaceLanguages = this.getInterfaceLanguages();
		const spellingLanguages = this.getSpellinngLanguages();
		const canHideMenu = UtilCommon.isPlatformWindows() || UtilCommon.isPlatformLinux();

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

					<div className="item">
						<Label text={translate('electronMenuShowTray')} />
						<Switch className="big" value={!hideTray} onChange={(e: any, v: boolean) => Renderer.send('setHideTray', v)}/>
					</div>

					{canHideMenu ? (
						<div className="item">
							<Label text={translate('electronMenuShowMenu')} />
							<Switch className="big" value={!hideMenuBar} onChange={(e: any, v: boolean) => Renderer.send('setMenuBarVisibility', v)}/>
						</div>
					) : ''}
				</div>

			</React.Fragment>
		);
	};

	getInterfaceLanguages () {
		const ret: any[] = [];
		const Locale = require('lib/json/locale.json');

		for (const id of Constant.enabledInterfaceLang) {
			ret.push({ id, name: Locale[id] });
		};

		return ret;
	};

	getSpellinngLanguages () {
		let ret: any[] = [];

		ret = ret.concat(commonStore.languages || []);
		ret = ret.map(id => ({ id, name: Constant.spellingLang[id] }));
		ret.unshift({ id: '', name: translate('commonDisabled') });

		return ret;
	};

});

export default PopupSettingsPagePersonal;
