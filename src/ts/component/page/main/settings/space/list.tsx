import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, IconObject, ObjectName, Icon } from 'Component';
import { I, S, U, J, translate, analytics } from 'Lib';

const PageMainSettingsSpacesList = observer(class PageMainSettingsSpacesList extends React.Component<I.PageSettingsComponent> {

	render () {
		const spaces = this.getItems();

		const Row = (space: any) => {
			const participant = U.Space.getMyParticipant(space.targetSpaceId);

			return (
				<div className="row">
					<div className="col colObject" onClick={() => this.onClick(space)}>
						<IconObject object={space} size={40} />
						<ObjectName object={space} />
					</div>
					<div className="col">{participant ? translate(`participantPermissions${participant.permissions}`) : ''}</div>
					<div className="col">{translate(`spaceStatus${space.spaceAccountStatus}`)}</div>
					<div className="col colMore">
						<Icon id={`icon-more-${space.id}`} className="more withBackground" onClick={() => this.onMore(space)} />
					</div>
				</div>
			);
		};

		return (
			<>
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
			</>
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
			U.Router.switchSpace(space.targetSpaceId, '', true, {}, false);
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

export default PageMainSettingsSpacesList;
