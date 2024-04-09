import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, IconObject, ObjectName, Icon } from 'Component';
import { I, UtilSpace, UtilRouter, translate, UtilMenu, analytics } from 'Lib';
import { dbStore, detailStore, authStore } from 'Store';
import Constant from 'json/constant.json';

const PopupSettingsPageSpacesList = observer(class PopupSettingsPageSpacesList extends React.Component<I.PopupSettings> {

	constructor (props) {
		super(props);
	};

	render () {
		const { accountSpaceId } = authStore;
		const spaces = this.getItems();

		const Row = (space: any) => {
			const { targetSpaceId } = space;
			const participant = UtilSpace.getMyParticipant(targetSpaceId);
			const creator = detailStore.get(Constant.subId.space, space.creator);
			const hasMenu = participant && (targetSpaceId != accountSpaceId);

			let creatorElement = null;
			if (participant && !participant.isOwner && !creator._empty_) {
				creatorElement = (
					<div className="creator">
						<IconObject object={creator} size={16} />
						<ObjectName object={creator} />
					</div>
				);
			};

			return (
				<div className="row">
					<div className="col colSpace" onClick={() => UtilRouter.switchSpace(space.targetSpaceId)}>
						<IconObject object={space} size={40} />
						<div className="info">
							<ObjectName object={space} />
							{creatorElement}
						</div>
					</div>
					<div className="col">{translate(`participantPermissions${space.permissions}`)}</div>
					<div className="col">{translate(`spaceStatus${space.spaceAccountStatus}`)}</div>
					<div className="col colMore">
						{hasMenu ? <Icon id={`icon-more-${space.id}`} className="more" onClick={() => this.onMore(space)} /> : ''}
					</div>
				</div>
			);
		};

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsSpacesListTitle')} />

				<div className="items">
					<div className="row isHead">
						<div className="col colSpace">{translate('popupSettingsSpacesListSpace')}</div>
						<div className="col">{translate('popupSettingsSpacesListAccess')}</div>
						<div className="col">{translate('popupSettingsSpacesListNetwork')}</div>
						<div className="col colMore" />
					</div>
					{spaces.map((item: any, i: number) => <Row key={i} {...item} />)}
				</div>
			</React.Fragment>
		);
	};

	getItems () {
		const subId = Constant.subId.space;
		const sortStatuses = [ I.ParticipantStatus.Joining, I.ParticipantStatus.Active, I.ParticipantStatus.Removing ];
		const sortPermissions = [ I.ParticipantPermissions.Owner, I.ParticipantPermissions.Writer, I.ParticipantPermissions.Reader ];
		const items = dbStore.getRecords(subId);

		return items.filter(it => !it.isAccountDeleted && it.isLocalOk).map(it => {
			const participant = UtilSpace.getMyParticipant(it.targetSpaceId);

			it.permissions = I.ParticipantPermissions.None;
			it.participantStatus = I.ParticipantStatus.Active;

			if (participant) {
				it.permissions = participant.permissions;
				it.participantStatus = participant.participantStatus;
			};

			return it;
		}).sort((c1, c2) => {
			const s1 = sortStatuses.indexOf(c1.participantStatus);
			const s2 = sortStatuses.indexOf(c2.participantStatus);
			const p1 = sortPermissions.indexOf(c1.permissions);
			const p2 = sortPermissions.indexOf(c2.permissions);

			if (s1 > s2) return 1;
			if (s1 < s2) return -1;
			if (p1 > p2) return 1;
			if (p1 < p2) return -1;

			return 0;
		});
	};

	onClick (space: any) {
		if (!space.isAccountJoining) {
			UtilRouter.switchSpace(space.targetSpaceId);
		};
	};

	onMore (space: any) {
		const { getId } = this.props;
		const element = $(`#${getId()} #icon-more-${space.id}`);

		UtilMenu.spaceContext(space, {
			element,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			onOpen: () => element.addClass('active'),
			onClose: () => element.removeClass('active'),
			route: analytics.route.settings,
		});
	};

});

export default PopupSettingsPageSpacesList;
