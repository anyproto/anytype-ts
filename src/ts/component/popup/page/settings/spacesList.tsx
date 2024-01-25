import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, IconObject, ObjectName, Button, Icon } from 'Component';
import { analytics, C, UtilRouter, UtilFile, I, translate, UtilCommon, UtilObject } from 'Lib';
import { blockStore, authStore, commonStore, dbStore, detailStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

const PopupSettingsPageSpacesList = observer(class PopupSettingsPageSpacesList extends React.Component<{}, {}> {

	constructor (props) {
		super(props);
	};

	render () {
		const spaces = dbStore.getSpaces();
		const { account } = authStore;

		const Row = (space) => {
			console.log('SPACE: ', space)
			const isOwner = space.creator == '_id_' + account.id;
			const creator = detailStore.get(Constant.subId.space, space.creator);
			const access = isOwner ? 'Owner' : 'View';

			return (
				<tr>
					<td className="columnSpace">
						<div className="spaceNameWrapper">
							<IconObject object={space} size={40} />
							<div className="spaceName">
								<ObjectName object={space} />

								{isOwner ? (
									<div className="creatorNameWrapper">
										<IconObject object={creator} size={16} />
										<ObjectName object={creator} />
									</div>
								) : ''}
							</div>
						</div>
					</td>
					<td>{access}</td>
					<td></td>
					<td></td>
					<td></td>
					<td className="columnMore">
						<div className="itemMore">
							<Icon className="more" />
						</div>
					</td>
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
								<th className="columnSpace">{translate('popupSettingsSpacesListSpace')}</th>
								<th>{translate('popupSettingsSpacesListAccess')}</th>
								<th>{translate('popupSettingsSpacesListSize')}</th>
								<th>{translate('popupSettingsSpacesListNetwork')}</th>
								<th>{translate('popupSettingsSpacesListDevice')}</th>
								<th className="columnMore"> </th>
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
