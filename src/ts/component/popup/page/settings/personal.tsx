import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Title, Label, Switch, Select } from 'Component';
import { I, translate, analytics, Renderer } from 'Lib';
import { commonStore, menuStore, dbStore } from 'Store';
import { observer } from 'mobx-react';

import Head from './head';

import Constant from 'json/constant.json';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
};


const PopupSettingsPagePersonal = observer(class PopupSettingsPagePersonal extends React.Component<Props> {

	constructor (props: any) {
		super(props);

		this.onType = this.onType.bind(this);
	};

	render () {
		const { autoSidebar, config } = commonStore;
		const type = dbStore.getType(commonStore.type);
		const languages = this.getLanguages();

		return (
			<div>
				<Head {...this.props} returnTo="index" name={translate('popupSettingsTitle')} />
				<Title text={translate('popupSettingsPersonalTitle')} />

				<div className="rows">
					<div className="row flex">
						<div className="side left">
							<Label text="Default Object type" />
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

					<div className="row flex">
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
								menuWidth={300}
								isMultiple={true}
							/>
						</div>
					</div>

					<div className="row flex">
						<div className="side left">
							<Label text="Automatically hide and show Sidebar" />
						</div>
						<div className="side right">
							<Switch value={autoSidebar} className="big" onChange={(e: any, v: boolean) => { commonStore.autoSidebarSet(v); }}/>
						</div>
					</div>
				</div>
			</div>
		);
	};

	onType (e: any) {
		const { getId } = this.props;

		menuStore.open('typeSuggest', {
			element: `#${getId()} #defaultType`,
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
		languages = languages.map(id => { return { id, name: Constant.spellingLang[id] }; });
		languages.unshift({ id: '', name: 'Disabled' });

		return languages;
	};

});

export default PopupSettingsPagePersonal;