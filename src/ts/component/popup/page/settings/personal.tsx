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
		const type = dbStore.getTypeByKey(commonStore.type);
		const languages = this.getLanguages();

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
						<Label text={translate('popupSettingsPersonalSpellcheckLanguages')} />

						<Select
							id="spellcheck"
							value={config.languages}
							options={languages}
							onChange={v => Renderer.send('setLanguage', v)}
							arrowClassName="black"
							isMultiple={true}
							noFilter={false}
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

	getLanguages () {
		let languages: any[] = [];

		languages = languages.concat(commonStore.languages || []);
		languages = languages.map(id => ({ id, name: Constant.spellingLang[id] }));
		languages.unshift({ id: '', name: 'Disabled' });

		return languages;
	};

});

export default PopupSettingsPagePersonal;