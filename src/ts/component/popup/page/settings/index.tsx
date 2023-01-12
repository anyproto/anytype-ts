import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import {Icon, Title, Label, IconObject} from 'Component';
import { I, translate } from 'Lib';
import {authStore, blockStore, detailStore} from 'Store';
import { observer } from 'mobx-react';
import Constant from "json/constant.json";

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
};

const PopupSettingsPageIndex = observer(class PopupSettingsPageIndex extends React.Component<Props, object> {

	render () {
		const { onPage } = this.props;
		const { account } = authStore;
		const profile = detailStore.get(Constant.subId.profile, blockStore.profile);
		const rows = [
			{ id: 'personal', title: 'popupSettingsPersonalTitle', icon: 'personal'},
			{ id: 'appearance', title: 'popupSettingsAppearanceTitle', icon: 'appearance'},
			{ id: 'importIndex', title: 'popupSettingsImportTitle', icon: 'import'},
			{ id: 'exportMarkdown', title: 'popupSettingsExportTitle', icon: 'export'}
		];

		if (account) {
			rows.unshift({ id: 'account', title: 'popupSettingsAccountTitle', icon: ''});
		};

		const Row = (row: any) => {
			let icon = <Icon className={row.icon} />;

			if (row.id === 'account') {
				icon = <IconObject object={profile} size={32} />;
			};

			return (
				<div className="row" onClick={() => { onPage(row.id); }}>
					{icon}
					<Label text={translate(row.title)} />
					<Icon className="arrow" />
				</div>
			);
		};

		return (
			<div>
				<Title text={translate('popupSettingsTitle')} />

				<div className="rows">
					{
						rows.map((row: any, idx: number) => {
							return <Row key={idx} {...row} />;
						})
					}
				</div>
			</div>
		);
	};

});

export default PopupSettingsPageIndex;