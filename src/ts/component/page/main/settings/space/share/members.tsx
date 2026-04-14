import React, { forwardRef, useRef, useEffect } from 'react';
import { Title, Label, Icon, Button, IconObject, ObjectName } from 'Component';
import * as I from 'Interface';

const SUB_ID = 'settingsPendingMembers';

const Members = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { space } = S.Common;
	const spaceview = U.Space.getSpaceview();
	const participant = U.Space.getParticipant();
	const nodeRef = useRef(null);
	const isOwner = U.Space.isMyOwner();
	const pendingIdentities = Action.getPendingMembers(space);
	const { isOnline } = S.Common;
	const showOfflinePill = !isOnline && (pendingIdentities.length > 0);

	useEffect(() => {
		if (!pendingIdentities.length) {
			return;
		};

		U.Subscription.subscribe({
			subId: SUB_ID,
			keys: U.Subscription.participantRelationKeys(),
			filters: [
				{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
				{ relationKey: 'identity', condition: I.FilterCondition.In, value: pendingIdentities },
			],
			ignoreHidden: false,
			noDeps: true,
			crossSpace: true,
		});

		return () => {
			U.Subscription.destroyList([ SUB_ID ]);
		};
	}, [ pendingIdentities.join(',') ]);

	const onUpgrade = (type: string) => {
		Action.membershipUpgrade({ type, route: analytics.route.settingsSpaceShare });
	};

	const getParticipantList = () => {
		const statuses = [ I.ParticipantStatus.Active ];

		if (isOwner) {
			statuses.push(I.ParticipantStatus.Joining);
		};

		return U.Space.getParticipantsList(statuses).sort((c1, c2) => {
			const isOwner1 = c1.permissions == I.ParticipantPermissions.Owner;
			const isOwner2 = c2.permissions == I.ParticipantPermissions.Owner;
			const isRequest1 = c1.isJoining;
			const isRequest2 = c2.isJoining;

			if (isOwner1 && !isOwner2) return -1;
			if (!isOwner1 && isOwner2) return 1;
			if (isRequest1 && !isRequest2) return -1;
			if (!isRequest1 && isRequest2) return 1;
			if (isRequest1 && isRequest2) return c1.createdDate < c2.createdDate ? -1 : 1;

			return 0;
		});
	};

	const getParticipantOptions = (isNew?: boolean) => {
		const removeLabel = isNew ? translate('popupSettingsSpaceShareRejectRequest') : translate('popupSettingsSpaceShareRemoveMember');
		const isReaderLimit = U.Space.getReaderLimit() <= 0;
		const isWriterLimit = U.Space.getWriterLimit() <= 0;

		let items: any[] = [
			{ id: I.ParticipantPermissions.Reader, disabled: isReaderLimit },
			{ id: I.ParticipantPermissions.Writer, disabled: isWriterLimit },
		] as any[];

		items = items.map(it => {
			it.name = translate(`participantPermissions${it.id}`);
			return it;
		});

		if (items.length) {
			items.push({ isDiv: true });
		};

		items.push({ id: 'remove', name: removeLabel, color: 'destructive' });

		return items;
	};

	const onPermissionsSelect = (item: any, isNew?: boolean) => {
		S.Menu.open('select', {
			element: `#item-${U.Common.esc(item.id)}-select`,
			horizontal: I.MenuDirection.Right,
			data: {
				value: item.permissions,
				options: getParticipantOptions(isNew),
				onSelect: (e: any, el: any) => onChangePermissions(item, el.id, isNew),
			},
		});
	};

	const onChangePermissions = (item: any, v: any, isNew?: boolean) => {
		let title = '';
		let text = '';
		let button = '';
		let onConfirm = null;

		switch (v) {
			case 'remove': {
				title = translate('popupConfirmMemberRemoveTitle');
				text = U.String.sprintf(translate('popupConfirmMemberRemoveText'), item.name);
				button = translate('commonRemove');
				onConfirm = () => {
					if (isNew) {
						C.SpaceRequestDecline(space, item.identity);
					} else {
						C.SpaceParticipantRemove(space, [ item.identity ]);
					};

					analytics.event(isNew ? 'RejectInviteRequest' : 'RemoveSpaceMember');
				};
				break;
			};

			default: {
				v = Number(v) || I.ParticipantPermissions.Reader;

				title = translate('commonAreYouSure');
				text = U.String.sprintf(translate('popupConfirmMemberChangeText'), item.name, translate(`participantPermissions${v}`));

				onConfirm = () => {
					if (isNew) {
						C.SpaceRequestApprove(space, item.identity, v);
					} else {
						C.SpaceParticipantPermissionsChange(space, [ { identity: item.identity, permissions: Number(v) } ]);
					};

					analytics.event(isNew ? 'ApproveInviteRequest' : 'ChangeSpaceMemberPermissions', { type: v });
				};
				break;
			};
		};

		S.Popup.open('confirm', {
			data: {
				title,
				text,
				textConfirm: button,
				colorConfirm: 'red',
				onConfirm,
			},
		});
	};

	const members = getParticipantList();
	const activeIdentities = new Set(members.map(it => it.identity).filter(it => it));
	const seen = new Set<string>();
	const pendingRecords = S.Record.getRecords(SUB_ID).filter(it => {
		if (!it.identity || activeIdentities.has(it.identity) || seen.has(it.identity)) {
			return false;
		};

		seen.add(it.identity);
		return true;
	});
	const length = members.length;

	let limitLabel = '';
	let limitButton = '';
	let showLimit = false;
	let memberUpgradeType = '';

	if (spaceview.isShared && !U.Space.getReaderLimit()) {
		limitLabel = translate('popupSettingsSpaceShareInvitesReaderLimitReachedLabel');
		limitButton = translate('popupSettingsSpaceShareInvitesReaderLimitReachedButton');
		memberUpgradeType = 'members';
		showLimit = true;
	};

	const Member = (item: any) => {
		const { id, permissions, status, isActive, isDeclined, isRemoved, isJoining, globalName } = item;
		const isCurrent = id == participant?.id;

		let button = null;

		if (isOwner) {
			if (isCurrent) {
				button = <Label text={translate(`participantPermissions${permissions}`)} />;
			} else {
				const placeholder = isJoining ? translate('popupSettingsSpaceShareSelectPermissions') : translate(`participantPermissions${item.permissions}`);

				button = (
					<div id={`item-${id}-select`} className="select" onClick={() => onPermissionsSelect(item, isJoining)}>
						<div className="item">
							<div className="name">{placeholder}</div>
						</div>
						<Icon name="arrow/small" className={[ 'arrow', isJoining ? 'light' : 'dark' ].join(' ')} width={6} height={10} />
					</div>
				);
			};
		} else
		if (isActive) {
			button = <Label color="grey" text={translate(`participantPermissions${permissions}`)} />;
		} else
		if (isDeclined || isRemoved) {
			button = <Label color="red" text={translate(`participantStatus${status}`)} />;
		};

		return (
			<div id={`item-${id}`} className={[ 'row', isJoining ? 'isNew' : '' ].join(' ')}>
				<div className="side left" onClick={e => U.Object.openEvent(e, item)} onAuxClick={e => U.Object.openEvent(e, item)}>
					<IconObject size={48} object={item} />
					<div className="text">
						<ObjectName object={item} withPronoun={item.id == participant?.id} withBadge={true} />
						{globalName ? <Label className="anyId" text={globalName} /> : ''}
					</div>
				</div>
				<div className="side right">
					{button}
				</div>
			</div>
		);
	};

	const PendingMember = (item: any) => {
		const object = {
			...item,
			layout: I.ObjectLayout.Participant,
		};

		return (
			<div className="row isPending">
				<div className="side left">
					<IconObject size={48} object={object} />
					<div className="text">
						<ObjectName object={object} />
						{item.globalName ? <Label className="anyId" text={item.globalName} /> : ''}
					</div>
				</div>
				<div className="side right">
					<Label color="grey" text={translate('commonPending')} />
				</div>
			</div>
		);
	};

	return (
		<div
			ref={nodeRef}
			id="sectionMembers"
			className="section sectionMembers"
		>
			{showOfflinePill ? (
				<div className="offlinePill">
					<Icon name="common/offline" />
					{translate('popupSettingsSpaceShareOffline')}
				</div>
			) : ''}

			<div className="membersTitle">
				<Title text={translate('commonMembers')} />
				{length > 1 ? <Label text={String(length)} /> : ''}
			</div>

			{showLimit ? (
				<div className="row payment">
					<Label text={limitLabel} />
					<Button className="payment" text={limitButton} onClick={() => onUpgrade(memberUpgradeType)} />
				</div>
			) : ''}

			<div id="list" className="rows">
				{members.map((item: any) => (
					<Member key={item.id} {...item} />
				))}
				{pendingRecords.map((item: any) => (
					<PendingMember key={item.identity} {...item} />
				))}
			</div>
		</div>
	);

});

export default Members;
