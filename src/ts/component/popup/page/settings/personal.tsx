import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Switch, Select } from 'Component';
import { I, translate, analytics, Renderer } from 'Lib';
import { commonStore, menuStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.Popup {
	prevPage: string;
	onPage: (id: string) => void;
};

const PopupSettingsPagePersonal = observer(class PopupSettingsPagePersonal extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onType = this.onType.bind(this);
	};

	render () {
		const { config } = commonStore;
		const type = dbStore.getType(commonStore.type);
		const languages = this.getLanguages();

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsPersonalTitle')} />

				<div className="rows">
					<div className="row">
						<div className="side left">
							<Label text="Default object type" />
						</div>
						<div className="side right">
							<div id="defaultType" className="select" onClick={this.onType}>
								<div className="item">
									<div className="name">{type?.name || 'Select'}</div>
								</div>
								<Icon className="arrow light" />
							</div>
						</div>
					</div>

					<div className="row">
						<div className="side left">
							<Label text="Spellcheck languages" />
						</div>
						<div className="side right">
							<Select 
								id="spellcheck" 
								value={config.languages} 
								options={languages} 
								onChange={(v: any) => { Renderer.send('setLanguage', v); }}
								arrowClassName="light"
								isMultiple={true}
								noFilter={false}
								menuParam={{ horizontal: I.MenuDirection.Right, width: 300 }}
							/>
						</div>
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
				smartblockTypes: [ I.SmartBlockType.Page ],
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

	getLanguages () {
		let languages: any[] = [];

		languages = languages.concat(commonStore.languages || []);
		languages = languages.map(id => ({ id, name: Constant.spellingLang[id] }));
		languages.unshift({ id: '', name: 'Disabled' });

		return languages;
	};

});

export default PopupSettingsPagePersonal;