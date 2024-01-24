import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, IconObject, ObjectName, Button } from 'Component';
import { analytics, C, UtilRouter, UtilFile, I, translate, UtilCommon } from 'Lib';
import { authStore, commonStore, dbStore, popupStore } from 'Store';

const PopupSettingsPageSpacesList = observer(class PopupSettingsPageSpacesList extends React.Component<{}, {}> {

	constructor (props) {
		super(props);
	};

	render () {
		const spaces = dbStore.getSpaces();

		const Row = (space) => {
			console.log('SPACE: ', space)
			return (
				<tr>
					<td>
						<div className="spaceNameWrapper">
							<IconObject object={space} />
							<div className="spaceName">
								<ObjectName object={space} />
							</div>
						</div>
					</td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
					<td></td>
				</tr>
			);
		};

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsSpacesListTitle')} />

				<div className="spacesList">
					<table>
						<thead>
							<tr>
								<th>{translate('popupSettingsSpacesListSpace')}</th>
								<th>{translate('popupSettingsSpacesListAccess')}</th>
								<th>{translate('popupSettingsSpacesListSize')}</th>
								<th>{translate('popupSettingsSpacesListNetwork')}</th>
								<th>{translate('popupSettingsSpacesListDevice')}</th>
								<th> </th>
							</tr>
						</thead>
						<tbody>
							{spaces.map((item: any, i: number) => (
								<Row key={i} {...item} />
							))}
						</tbody>
					</table>
				</div>
			</React.Fragment>
		);
	};

});

export default PopupSettingsPageSpacesList;
