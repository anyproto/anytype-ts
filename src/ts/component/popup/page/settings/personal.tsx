import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Select } from 'Component';
import { I, translate, UtilMenu, Action } from 'Lib';
import { commonStore } from 'Store';

const PopupSettingsPagePersonal = observer(class PopupSettingsPagePersonal extends React.Component<I.PopupSettings> {

	constructor (props: I.PopupSettings) {
		super(props);
	};

	render () {
		const { config, interfaceLang } = commonStore;
		const { languages } = config;
		const interfaceLanguages = UtilMenu.getInterfaceLanguages();
		const spellingLanguages = UtilMenu.getSpellingLanguages();

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
				</div>

			</React.Fragment>
		);
	};

});

export default PopupSettingsPagePersonal;
