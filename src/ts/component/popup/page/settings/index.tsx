import * as React from 'react';
import { Icon, Title, Label, IconObject } from 'Component';
import { I, translate } from 'Lib';
import { authStore, blockStore, detailStore, commonStore } from 'Store';
import { observer } from 'mobx-react';
import Constant from 'json/constant.json';

interface Props extends I.Popup {
	prevPage: string;
	onPage: (id: string) => void;
};

const PopupSettingsPageIndex = observer(class PopupSettingsPageIndex extends React.Component<Props> {

	render () {
		const { onPage } = this.props;
		const { account } = authStore;
		const profile = detailStore.get(Constant.subId.profile, blockStore.profile);
		const space = detailStore.get(Constant.subId.space, commonStore.workspace);

		let rows = [
			{ id: 'personal', title: translate('popupSettingsPersonalTitle'), icon: 'personal' },
			{ id: 'appearance', title: translate('popupSettingsAppearanceTitle'), icon: 'appearance' },
			{ id: 'importIndex', title: translate('popupSettingsImportTitle'), icon: 'import' },
			{ id: 'exportMarkdown', title: translate('popupSettingsExportTitle'), icon: 'export' }
		];

		if (account) {
			rows = [ 
				{ id: 'account', title: translate('popupSettingsAccountTitle'), icon: '' },
				{ id: 'spaceIndex', title: (space._empty_ ? translate('popupSettingsSpaceTitle') : space.name), icon: '' }
			].concat(rows);
		};

		const Row = (row: any) => {
			let icon = null;
			if (row.id == 'account') {
				icon = <IconObject object={profile} size={32} forceLetter={true} />;
			} else 
			if (row.id == 'spaceIndex') {
				icon = <IconObject object={space} size={32} forceLetter={true} />;
			} else 
			if (row.icon) {
				icon = <Icon className={row.icon} />;
			};

			return (
				<div className="row" onClick={() => { onPage(row.id); }}>
					{icon}
					<Label text={row.title} />
					<Icon className="arrow" />
				</div>
			);
		};

		return (
			<div>
				<Title text={translate('popupSettingsTitle')} />

				<div className="rows">
					{rows.map((item: any, i: number) => (
						<Row key={i} {...item} />
					))}
				</div>
			</div>
		);
	};

});

export default PopupSettingsPageIndex;