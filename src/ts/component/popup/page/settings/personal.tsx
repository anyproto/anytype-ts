import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Select } from 'Component';
import { I, translate, analytics, Renderer, UtilObject, Storage } from 'Lib';
import { commonStore, menuStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

const PopupSettingsPagePersonal = observer(class PopupSettingsPagePersonal extends React.Component<I.PopupSettings> {

	constructor (props: I.PopupSettings) {
		super(props);

		this.onType = this.onType.bind(this);
	};

	render () {
		const { config } = commonStore;
		const type = dbStore.getTypeById(commonStore.type);
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
								<div className="name">{type?.name || translate('commonSelect')}</div>
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
							id="spellcheck"
							value={Storage.get('interfaceLang')}
							options={interfaceLanguages}
							onChange={v => {
								Storage.set('interfaceLang', v);
								Renderer.send('reloadAllWindows');
							}}
							arrowClassName="black"
							menuParam={{ horizontal: I.MenuDirection.Right, width: 300 }}
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
					commonStore.typeSet(item.typeKey);
					analytics.event('DefaultTypeChange', { objectType: item.typeKey });
				},
			}
		});
	};

	getInterfaceLanguages () {
		const ret: any[] = [];

		for (let id in Constant.interfaceLang) {
			ret.push({ id, name: Constant.interfaceLang[id] })
		};

		return ret;
	};

	getSpellinngLanguages () {
		let ret: any[] = [];

		ret = ret.concat(commonStore.languages || []);
		ret = ret.map(id => ({ id, name: Constant.spellingLang[id] }));
		ret.unshift({ id: '', name: 'Disabled' });

		return ret;
	};

});

export default PopupSettingsPagePersonal;