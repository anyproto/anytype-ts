import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, ListManager } from 'Component';
import { I, J, translate, Action, analytics } from 'Lib';
import Head from '../head';

const PopupSettingsPageStorageManager = observer(class PopupSettingsPageStorageManager extends React.Component<I.PopupSettings, {}> {

	refManager = null;

	constructor (props: I.PopupSettings) {
		super(props);

		this.onRemove = this.onRemove.bind(this);
		this.onBack = this.onBack.bind(this);
	};

	render () {
		const buttons: I.ButtonComponent[] = [
			{ icon: 'remove', text: translate('commonDeleteImmediately'), onClick: this.onRemove }
		];
		const filters: I.Filter[] = [
			{ relationKey: 'fileSyncStatus', condition: I.FilterCondition.Equal, value: I.FileSyncStatus.Synced },
		];
		const sorts: I.Sort[] = [
			{ type: I.SortType.Desc, relationKey: 'sizeInBytes' },
		];

		return (
			<div className="wrap">
				<Head onPage={this.onBack} name={translate('commonBack')} />
				<Title text={translate('popupSettingsSpaceStorageManagerTitle')} />

				<ListManager
					ref={ref => this.refManager = ref}
					subId={J.Constant.subId.fileManager}
					rowLength={2}
					buttons={buttons}
					info={I.ObjectManagerItemInfo.FileSize}
					iconSize={18}
					sorts={sorts}
					filters={filters}
					ignoreHidden={false}
					ignoreArchived={false}
					textEmpty={translate('popupSettingsSpaceStorageManagerEmptyLabel')}
				/>
			</div>
		);
	};

	onRemove () {
		Action.delete(this.refManager.getSelected(), analytics.route.settings, () => this.refManager?.selectionClear());
	};

	onBack () {
		this.props.onPage('spaceIndex');
	};

});

export default PopupSettingsPageStorageManager;