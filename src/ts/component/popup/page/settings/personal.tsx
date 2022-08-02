import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Title, Label, Switch, Select } from 'ts/component';
import { I, translate, DataUtil, analytics } from 'ts/lib';
import { commonStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

import Head from './head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
};

const Constant = require('json/constant.json');

const PopupSettingsPagePersonal = observer(class PopupSettingsPagePersonal extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onType = this.onType.bind(this);
	};

	render () {
		const { autoSidebar } = commonStore;
		const types = DataUtil.getObjectTypesForNewObject(false);
		const type = types.find(it => it.id == commonStore.type);

		return (
			<div>
				<Head {...this.props} id="index" name={translate('popupSettingsTitle')} />
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
		
		let types = DataUtil.getObjectTypesForNewObject().map(it => it.id);
		types = types.filter(it => ![ Constant.typeId.bookmark ].includes(it));

		menuStore.open('searchObject', {
			element: `#${getId()} #defaultType`,
			className: 'big single',
			data: {
				isBig: true,
				placeholder: 'Change object type',
				placeholderFocus: 'Change object type',
				value: commonStore.type,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: types }
				],
				onSelect: (item: any) => {
					this.onTypeChange(item.id);
				},
				dataSort: (c1: any, c2: any) => {
					let i1 = types.indexOf(c1.id);
					let i2 = types.indexOf(c2.id);

					if (i1 > i2) return 1;
					if (i1 < i2) return -1;
					return 0;
				}
			}
		});
	};

	onTypeChange (id: string) {
		commonStore.defaultTypeSet(id);
		analytics.event('DefaultTypeChange', { objectType: id });
	};

});

export default PopupSettingsPagePersonal;