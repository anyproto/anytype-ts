import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, IconObject, ObjectName, Icon } from 'Component';
import { I, UtilObject, translate } from 'Lib';
import { authStore, dbStore, detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

const PopupSettingsPageSpacesList = observer(class PopupSettingsPageSpacesList extends React.Component<{}, {}> {

	constructor (props) {
		super(props);
	};

	render () {
		const { account } = authStore;
		const spaces = dbStore.getSpaces();

		const Row = (space) => {
			const creator = detailStore.get(Constant.subId.space, space.creator);
			const isOwner = creator.permissions == I.ParticipantPermissions.Owner;
			const participant = detailStore.get(Constant.subId.myParticipant, UtilObject.getParticipantId(space.targetSpaceId, account.id));

			return (
				<tr>
					<td className="columnSpace">
						<div className="spaceNameWrapper">
							<IconObject object={space} size={40} />
							<div className="spaceName">
								<ObjectName object={space} />

								{!isOwner ? (
									<div className="creatorNameWrapper">
										<IconObject object={creator} size={16} />
										<ObjectName object={creator} />
									</div>
								) : ''}
							</div>
						</div>
					</td>
					<td>{translate(`participantPermissions${participant.permissions}`)}</td>
					<td>{translate(`spaceStatus${space.spaceAccountStatus}`)}</td>
					<td>{translate(`spaceStatus${space.spaceLocalStatus}`)}</td>

					<td className="columnMore">
						<div id={`icon-more-${space.id}`} onClick={e => this.onSpaceMore(e, space)} className="iconWrap">
							<Icon className="more" />
						</div>
					</td>
				</tr>
			);
		};

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsSpacesListTitle')} />

				<div className="items">
					<table>
						<thead>
							<tr>
								<th className="columnSpace">{translate('popupSettingsSpacesListSpace')}</th>
								<th>{translate('popupSettingsSpacesListAccess')}</th>
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

	onSpaceMore (e: React.MouseEvent, space) {
		const { spaceAccessType, creator } = space;
		const element = $(`#icon-more-${space.id}`);
		const options: any[] = [
			{ id: 'offload', name: translate('popupSettingsSpacesMenuMoreOffload') },
		];

		if (UtilObject.isSpaceOwner(creator)) {
			if (spaceAccessType == I.SpaceType.Shared) {
				options.push({ id: 'deleteFromNetwork', color: 'red', name: translate('popupSettingsSpacesMenuMoreDeleteFromNetwork') });
			};
		} else {
			options.push({ id: 'leave', color: 'red', name: translate('popupSettingsSpacesMenuMoreDeleteFromNetwork') });
		};

		menuStore.open('select', {
			element,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			onOpen: () => element.addClass('active'),
			onClose: () => element.removeClass('active'),
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'offload':
							console.log('OFFLOAD')
							break;

						case 'leave':
							console.log('LEAVE')
							break;

						case 'deleteFromNetwork':
							console.log('DELETE')
							break;
					};
				}
			}
		});
	};

});

export default PopupSettingsPageSpacesList;
