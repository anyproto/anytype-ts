import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, IconObject, ObjectName, Icon } from 'Component';
import { I, S, U, J, translate, analytics } from 'Lib';

const PopupSettingsPageSpacesList = observer(class PopupSettingsPageSpacesList extends React.Component<I.PopupSettings> {

	render () {
		const spaces = this.getItems();

		const Row = (space: any) => {
			const participant = U.Space.getMyParticipant(space.targetSpaceId);
			const creator = U.Space.getCreator(space.targetSpaceId, space.creator);
			const hasMenu = !space.isPersonal;

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
					<div className="col colSpace" onClick={() => this.onClick(space)}>
						<IconObject object={space} size={40} />
						<div className="info">
							<ObjectName object={space} />
							{creatorElement}
						</div>
					</div>
					<div className="col">{participant ? translate(`participantPermissions${participant.permissions}`) : ''}</div>
					<div className="col">{translate(`spaceStatus${space.spaceAccountStatus}`)}</div>
					<div className="col colMore">
						{hasMenu ? <Icon id={`icon-more-${space.id}`} className="more withBackground" onClick={() => this.onMore(space)} /> : ''}
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
		const items = S.Record.getRecords(J.Constant.subId.space);

		return items.filter(it => it.isAccountActive).map(it => {
			it.participant = U.Space.getMyParticipant(it.targetSpaceId) || {};
			return it;
		}).sort((c1, c2) => {
			if (c1.isAccountJoining && !c2.isAccountJoining) return -1;
			if (!c1.isAccountJoining && c2.isAccountJoining) return 1;

			if (c1.isAccountActive && !c2.isAccountActive) return -1;
			if (!c1.isAccountActive && c2.isAccountActive) return 1;

			const p1 = c1.participant;
			const p2 = c2.participant;

			if (p1.isOwner && !p2.isOwner) return -1;
			if (!p1.isOwner && p2.isOwner) return 1;

			if (p1.isWriter && !p2.isWriter) return -1;
			if (!p1.isWriter && p2.isWriter) return 1;

			if (p1.isReader && !p2.isReader) return -1;
			if (!p1.isReader && p2.isReader) return 1;

			if (c1.isAccountRemoving && !c2.isAccountRemoving) return -1;
			if (!c1.isAccountRemoving && c2.isAccountRemoving) return 1;

			return 0;
		});
	};

	onClick (space: any) {
		if (space.isAccountActive) {
			U.Router.switchSpace(space.targetSpaceId, '', true, {});
		};
	};

	onMore (space: any) {
		const { getId } = this.props;
		const element = $(`#${getId()} #icon-more-${space.id}`);

		U.Menu.spaceContext(space, {
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
