import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon, Button, IconObject, ObjectName, Tag, Loader } from 'Component';
import { I, C, S, U, translate, Action, analytics, } from 'Lib';
import { AutoSizer, WindowScroller, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';

interface State {
	isLoading: boolean;
};

const HEIGHT = 64;

const Members = observer(class Members extends React.Component<I.PageSettingsComponent, State> {

	node: any = null;
	cache: any = null;
	top = 0;
	refList: any = null;

	state = {
		isLoading: false,
	};

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
		this.onChangePermissions = this.onChangePermissions.bind(this);
		this.onPermissionsSelect = this.onPermissionsSelect.bind(this);
		this.onUpgrade = this.onUpgrade.bind(this);
	};

	render () {
		const { isLoading } = this.state;

		if (isLoading) {
			return <Loader id="loader" />;
		};

		const { isPopup } = this.props;
		const { membership } = S.Auth;
		const tier = U.Data.getMembershipTier(membership.tier);
		const space = U.Space.getSpaceview();
		const participant = U.Space.getParticipant();
		const members = this.getParticipantList();
		const length = members.length;
		const isSpaceOwner = U.Space.isMyOwner();

		let limitLabel = '';
		let limitButton = '';
		let showLimit = false;
		let memberUpgradeType = '';

		if (space.isShared) {
			if (!U.Space.getReaderLimit() && tier?.price) {
				limitLabel = translate('popupSettingsSpaceShareInvitesReaderLimitReachedLabel');
				limitButton = translate('popupSettingsSpaceShareInvitesReaderLimitReachedButton');
				memberUpgradeType = 'members';
				showLimit = true;
			} else
			if (!U.Space.getWriterLimit()) {
				limitLabel = translate('popupSettingsSpaceShareInvitesWriterLimitReachedLabel');
				limitButton = translate('popupSettingsSpaceShareInvitesWriterLimitReachedButton');
				memberUpgradeType = 'editors';
				showLimit = true;
			};
		};

		const Member = (item: any) => {
			const isCurrent = item.id == participant?.id;
			const isNew = item.isJoining;

			let button = null;

			if (isSpaceOwner) {
				if (isCurrent) {
					button = <Label text={translate(`participantPermissions${item.permissions}`)} />;
				} else {
					const placeholder = isNew ? translate('popupSettingsSpaceShareSelectPermissions') : translate(`participantPermissions${item.permissions}`);

					button = (
						<div id={`item-${item.id}-select`} className="select" onClick={() => this.onPermissionsSelect(item, isNew)}>
							<div className="item">
								<div className="name">{placeholder}</div>
							</div>
							<Icon className={[ 'arrow', isNew ? 'light' : 'dark' ].join(' ')} />
						</div>
					);
				};
			} else
			if (item.isActive) {
				button = <Label color="grey" text={translate(`participantPermissions${item.permissions}`)} />;
			} else
			if (item.isDeclined || item.isRemoved) {
				button = <Label color="red" text={translate(`participantStatus${item.status}`)} />;
			};

			return (
				<div id={`item-${item.id}`} className={[ 'row', isNew ? 'isNew' : '' ].join(' ')} style={item.style} >
					<div className="side left" onClick={() => U.Object.openConfig(item)}>
						<IconObject size={48} object={item} />
						<ObjectName object={item} />
						{isCurrent ? <div className="caption">({translate('commonYou')})</div> : ''}
					</div>
					<div className="side right">
						{button}
					</div>
				</div>
			);
		};

		const rowRenderer = (param: any) => {
			const item: any = members[param.index];
			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					<Member key={item.id} {...item} index={param.index} style={param.style} />
				</CellMeasurer>
			);
		};

		return (
			<div
				ref={node => this.node = node}
				id="sectionMembers"
				className="section sectionMembers"
			>
				<div className="membersTitle">
					<Title text={translate('commonMembers')} />
					{length > 1 ? <Label text={String(length)} /> : ''}
				</div>

				{showLimit ? (
					<div className="row payment">
						<Label text={limitLabel} />
						<Button className="payment" text={limitButton} onClick={() => this.onUpgrade(memberUpgradeType)} />
					</div>
				) : ''}

				{this.cache ? (
					<div id="list" className="rows">
						<WindowScroller scrollElement={U.Common.getScrollContainer(isPopup).get(0)}>
							{({ height, isScrolling, registerChild, scrollTop }) => (
								<AutoSizer disableHeight={true} className="scrollArea">
									{({ width }) => (
										<List
											ref={ref => this.refList = ref}
											autoHeight={true}
											height={Number(height) || 0}
											width={Number(width) || 0}
											deferredMeasurementCache={this.cache}
											rowCount={length}
											rowHeight={HEIGHT}
											rowRenderer={rowRenderer}
											onScroll={this.onScroll}
											isScrolling={isScrolling}
											scrollTop={scrollTop}
										/>
									)}
								</AutoSizer>
							)}
						</WindowScroller>
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount () {
		const items = this.getParticipantList();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (items[i] || {}).id,
		});

		this.forceUpdate();
	};

	componentDidUpdate() {
		this.resize();
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	onUpgrade (type: string) {
		Action.membershipUpgrade();

		analytics.event('ClickUpgradePlanTooltip', { type, route: analytics.route.settingsSpaceShare });
	};

	getParticipantList () {
		let records = U.Space.getParticipantsList([ I.ParticipantStatus.Joining, I.ParticipantStatus.Active ]);

		records = records.sort((c1, c2) => {
			const isRequest1 = c1.isJoining;
			const isRequest2 = c2.isJoining;
			const cd1 = c1.createdDate;
			const cd2 = c2.createdDate;

			if (isRequest1 && !isRequest2) return -1;
			if (!isRequest1 && isRequest2) return 1;
			if (isRequest1 && isRequest2) return cd1 < cd2 ? -1 : 1;

			return 0;
		});

		return records.sort((c1, c2) => {
			const isOwner1 = c1.permissions == I.ParticipantPermissions.Owner;
			const isOwner2 = c2.permissions == I.ParticipantPermissions.Owner;

			if (isOwner1 && !isOwner2) return -1;
			if (!isOwner1 && isOwner2) return 1;

			return 0;
		});
	};

	getParticipantOptions (isNew?: boolean) {
		const { membership } = S.Auth;
		const tier = U.Data.getMembershipTier(membership.tier);
		const removeLabel = isNew ? translate('popupSettingsSpaceShareRejectRequest') : translate('popupSettingsSpaceShareRemoveMember');

		let items: any[] = [] as any[];

		if (!tier?.price || (U.Space.getReaderLimit() - 1 >= 0)) {
			items.push({ id: String(I.ParticipantPermissions.Reader) });
		};
		if (!tier?.price || (U.Space.getWriterLimit() - 1 >= 0)) {
			items.push({ id: I.ParticipantPermissions.Writer });
		};

		items = items.map(it => {
			it.name = translate(`participantPermissions${it.id}`);
			return it;
		});

		if (items.length) {
			items.push({ isDiv: true });
		};

		items.push({ id: 'remove', name: removeLabel, color: 'red' });

		return items;
	};

	onPermissionsSelect (item: any, isNew?: boolean) {
		S.Menu.open('select', {
			element: `#item-${item.id}-select`,
			horizontal: I.MenuDirection.Right,
			data: {
				value: item.permissions,
				options: this.getParticipantOptions(isNew),
				onSelect: (e: any, el: any) => {
					this.onChangePermissions(item, Number(el.id), isNew);
				},
			},
		});
	};

	onChangePermissions (item: any, v: any, isNew?: boolean) {
		const { space } = S.Common;

		let title = '';
		let text = '';
		let button = '';
		let onConfirm = null;

		switch (v) {
			case 'remove': {
				title = translate('popupConfirmMemberRemoveTitle');
				text = U.Common.sprintf(translate('popupConfirmMemberRemoveText'), item.name);
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
				text = U.Common.sprintf(translate('popupConfirmMemberChangeText'), item.name, translate(`participantPermissions${v}`));

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

	onJoinRequest (item: any) {
		S.Popup.open('inviteConfirm', {
			data: {
				name: item.name,
				icon: item.iconImage,
				spaceId: S.Common.space,
				identity: item.identity,
				route: analytics.route.settings,
			}
		});
	};

	resize () {
		if (this.refList) {
			this.refList.recomputeRowHeights(0);
		};
	};

});

export default Members;
