import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, IconObject, ObjectName, Button } from 'Component';
import { analytics, C, UtilRouter, UtilFile, I, translate, UtilCommon } from 'Lib';
import { authStore, commonStore, popupStore } from 'Store';

interface Props extends I.PopupSettings {
	onPage: (id: string) => void;
	setLoading: (v: boolean) => void;
};

const PopupSettingsPageSpacesList = observer(class PopupSettingsPageSpacesList extends React.Component<Props, {}> {

	constructor (props: Props) {
		super(props);
	};

	render () {

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsSpacesListTitle')} />

			</React.Fragment>
		);
	};

});

export default PopupSettingsPageSpacesList;
