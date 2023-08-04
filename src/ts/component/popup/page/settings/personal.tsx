import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Select } from 'Component';
import { I, translate, analytics, Renderer, UtilObject } from 'Lib';
import { commonStore, menuStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

const PopupSettingsPagePersonal = observer(class PopupSettingsPagePersonal extends React.Component<I.PopupSettings> {

	constructor (props: I.PopupSettings) {
		super(props);

		this.onType = this.onType.bind(this);
	};

	render () {
		const { config } = commonStore;
		const type = dbStore.getType(commonStore.type);
		const interfaceLanguages = this.getInterfaceLanguages();
		const spellingLanguages = this.getSpellinngLanguages();

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsPersonalTitle')} />

				<div className="actionItems">
					<div className="item">
						<Label text={translate('popupSettingsPersonalDefaultObjectType')} />

						<div id="defaultType" className="select" onClick={this.onType}>
							<div className="item">
								<div className="name">{type?.name || translate('popupSettingsPersonalDefaultObjectTypeSelect')}</div>
							</div>
							<Icon className="arrow black" />
						</div>
					</div>

					<div className="item">
						<Label text={translate('popupSettingsPersonalSpellcheckLanguage')} />

						<Select
							id="spellcheck"
							value={config.languages}
							options={spellingLanguages}
							onChange={v => Renderer.send('setLanguage', v)}
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
							value={config.interfaceLang}
							options={interfaceLanguages}
							onChange={v => Renderer.send('changeInterfaceLang', v)}
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

	onType (e: any) {
		const { getId } = this.props;

		menuStore.open('typeSuggest', {
			element: `#${getId()} #defaultType`,
			horizontal: I.MenuDirection.Right,
			data: {
				filter: '',
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
				],
				onClick: (item: any) => {
					this.onTypeChange(item.id);
				},
			}
		});
	};

	onTypeChange (id: string) {
		commonStore.defaultTypeSet(id);

		analytics.event('DefaultTypeChange', { objectType: id });
	};

	getInterfaceLanguages () {
		const ret: any[] = [];
		const Locale = require('lib/json/locale.json');

		for (let id of Constant.enabledInterfaceLang) {
			ret.push({ id, name: Locale[id] })
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
