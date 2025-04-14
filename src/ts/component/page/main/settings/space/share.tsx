import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, Label, Icon, Input, Button, IconObject, ObjectName, Tag, Error, Loader } from 'Component';
import { I, C, S, U, translate, Preview, Action, analytics, sidebar, keyboard, } from 'Lib';
import { AutoSizer, WindowScroller, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';

interface State {
	isLoading: boolean;
	error: string;
	cid: string;
	key: string;
};

const HEIGHT = 64;

const PageMainSettingsSpaceShare = observer(class PageMainSettingsSpaceShare extends React.Component<I.PageSettingsComponent, State> {

	node: any = null;
	cache: any = null;
	top = 0;
	refInput = null;
	refList: any = null;
	refCopy: any = null;
	refButton: any = null;

	state = {
		isLoading: false,
		error: '',
		cid: '',
		key: '',
	};

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onInitLink = this.onInitLink.bind(this);
		this.onStopSharing = this.onStopSharing.bind(this);
		this.onChangePermissions = this.onChangePermissions.bind(this);
		this.onInfo = this.onInfo.bind(this);
		this.onMoreSpace = this.onMoreSpace.bind(this);
		this.onMoreLink = this.onMoreLink.bind(this);
		this.onPermissionsSelect = this.onPermissionsSelect.bind(this);
		this.onUpgrade = this.onUpgrade.bind(this);
	};

	render () {
		const { isLoading, error, cid, key } = this.state;

		if (isLoading) {
			return <Loader id="loader" />;
		};

		const { membership } = S.Auth;
		const hasLink = cid && key;
		const space = U.Space.getSpaceview();
		const participant = U.Space.getParticipant();
		const members = this.getParticipantList();
		const length = members.length;
		const isShareActive = U.Space.isShareActive();
		const isSpaceOwner = U.Space.isMyOwner();

		let inviteLinkLabelText = '';
		let limitLabel = '';
		let limitButton = '';
		let showLimit = false;
		let memberUpgradeType = '';

		if (!hasLink && !isSpaceOwner) {
			inviteLinkLabelText = translate('popupSettingsSpaceShareInviteLinkDisabled');
		} else {
			inviteLinkLabelText = translate('popupSettingsSpaceShareInviteLinkLabel');
		};

		if (space.isShared) {
			if (!U.Space.getReaderLimit() && membership.isExplorer) {
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

			let tag = null;
			let button = null;

			if (isSpaceOwner) {
				if (isCurrent) {
					button = <Label text={translate(`participantPermissions${item.permissions}`)} />;
				} else
				if (item.isJoining) {
					button = (
						<Button
							className="c36"
							color="blank"
							text={translate('popupSettingsSpaceShareViewRequest')}
							onClick={() => this.onJoinRequest(item)}
						/>
					);
				} else
				if (item.isRemoving) {
					button = (
						<Button
							className="c36"
							color="blank"
							text={translate('commonApprove')}
							onClick={() => this.onLeaveRequest(item)}
						/>
					);
				} else {
					button = (
						<div id={`item-${item.id}-select`} className="select" onClick={() => this.onPermissionsSelect(item)}>
							<div className="item">
								<div className="name">{translate(`participantPermissions${item.permissions}`)}</div>
							</div>
							<Icon className="arrow dark" />
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

			if (item.isJoining) {
				tag = <Tag text={translate('popupSettingsSpaceShareJoinRequest')} />;
			} else
			if (item.isRemoving) {
				tag = <Tag text={translate('popupSettingsSpaceShareLeaveRequest')} />;
			};

			return (
				<div id={`item-${item.id}`} className="row" style={item.style} >
					<div className="side left" onClick={() => U.Object.openConfig(item)}>
						<IconObject size={48} object={item} />
						<ObjectName object={item} />
						{tag}
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
			<div ref={node => this.node = node}>
				<div id="titleWrapper" className="titleWrapper">
					<Title text={translate('popupSettingsSpaceShareTitle')} />

					<div className="icons">
						<Icon className="question withBackground" onClick={this.onInfo} />
						{space.isShared && isSpaceOwner ? <Icon id="button-more-space" className="more withBackground" onClick={this.onMoreSpace} /> : ''}
					</div>
				</div>

				<div id="sectionInvite" className="section sectionInvite">
					<Title text={translate('popupSettingsSpaceShareInviteLinkTitle')} />
					<Label text={inviteLinkLabelText} />

					{hasLink ? (
						<div className="inviteLinkWrapper">
							<div className="inputWrapper">
								<Input ref={ref => this.refInput = ref} readonly={true} value={U.Space.getInviteLink(cid, key)} onClick={() => this.refInput?.select()} />
								<Icon id="button-more-link" className="more withBackground" onClick={this.onMoreLink} />
							</div>
							<Button ref={ref => this.refCopy = ref} onClick={this.onCopy} className="c40" color="blank" text={translate('commonCopyLink')} />
						</div>
					) : (
						<>
							{isSpaceOwner ? (
								<div className="buttons">
									<Button
										ref={ref => this.refButton = ref}
										onClick={isShareActive ? () => this.onInitLink() : null}
										className={[ 'c40', (isShareActive ? '' : 'disabled') ].join(' ')}
										tooltipParam={{ text: isShareActive ? '' : translate('popupSettingsSpaceShareGenerateInviteDisabled') }}
										text={translate('popupSettingsSpaceShareGenerateInvite')}
									/>
								</div>
							) : ''}
						</>
					)}
				</div>

				<div id="sectionMembers" className="section sectionMembers">
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
							<WindowScroller scrollElement={window}>
								{({ height, isScrolling, registerChild, scrollTop }) => (
									<AutoSizer disableHeight={true} className="scrollArea">
										{({ width }) => (
											<List
												ref={ref => this.refList = ref}
												autoHeight={true}
												height={Number(height) || 0}
												width={Number(width) || 0}
												deferredMeasurmentCache={this.cache}
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

				<Error text={error} />
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

		this.init();
		this.forceUpdate();

		analytics.event('ScreenSettingsSpaceShare');
	};

	componentDidUpdate() {
		this.init();
		this.resize();
	};

	init () {
		const { cid, key } = this.state;
		const space = U.Space.getSpaceview();

		if (space.isShared && !cid && !key) {
			U.Space.getInvite(S.Common.space, (cid: string, key: string) => {
				if (cid && key) {
					this.setInvite(cid, key);
				};
			});
		};
	};

	setInvite (cid: string, key: string) {
		this.setState({ cid, key });
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	onUpgrade (type: string) {
		const { membership } = S.Auth;

		if (membership.tier >= I.TierType.Builder) {
			Action.membershipUpgrade();
		} else {
			this.props.onPage('membership');
		};

		analytics.event('ClickUpgradePlanTooltip', { type, route: analytics.route.settingsSpaceShare });
	};

	getParticipantList () {
		const records = U.Space.getParticipantsList([ I.ParticipantStatus.Joining, I.ParticipantStatus.Removing, I.ParticipantStatus.Active ]);

		return records.sort((c1, c2) => {
			const isRequest1 = c1.isJoining || c1.isRemoving;
			const isRequest2 = c2.isJoining || c2.isRemoving;
			const cd1 = c1.createdDate;
			const cd2 = c2.createdDate;

			if (isRequest1 && !isRequest2) return -1;
			if (!isRequest1 && isRequest2) return 1;
			if (isRequest1 && isRequest2) return cd1 < cd2 ? -1 : 1;

			return 0;
		});
	};

	onCopy () {
		const { cid, key } = this.state;
		if (!cid || !key) {
			return;
		};

		U.Common.copyToast('', U.Space.getInviteLink(cid, key), translate('toastInviteCopy'));
		analytics.event('ClickShareSpaceCopyLink');
	};

	onInitLink () {
		const btn = this.refButton;
		const space = U.Space.getSpaceview();

		if (!btn || btn.isLoading()) {
			return;
		};

		btn.setLoading(true);
		analytics.event('ClickShareSpaceNewLink');

		C.SpaceMakeShareable(S.Common.space, (message: any) => {
			if (this.setError(message.error)) {
				btn.setLoading(false);
				return;
			};

			C.SpaceInviteGenerate(S.Common.space, (message: any) => {
				btn.setLoading(false);

				if (this.setError(message.error)) {
					return;
				};

				this.setInvite(message.inviteCid, message.inviteKey);
				Preview.toastShow({ text: translate('toastInviteGenerate') });

				if (!space.isShared) {
					analytics.event('ShareSpace');
				};
			});
		});
	};

	onStopSharing () {
		S.Popup.open('confirm', {
			data: {
				title: translate('popupConfirmStopSharingSpaceTitle'),
				text: translate('popupConfirmStopSharingSpaceText'),
				textConfirm: translate('popupConfirmStopSharingSpaceConfirm'),
				colorConfirm: 'red',
				onConfirm: () => {
					C.SpaceStopSharing(S.Common.space, () => this.setInvite('', ''));
					analytics.event('StopSpaceShare');
				},
			},
		});

		analytics.event('ScreenStopShare');
	};

	getParticipantOptions () {
		const { membership } = S.Auth;

		let items: any[] = [] as any[];

		if (membership.isExplorer || (U.Space.getReaderLimit() - 1 >= 0)) {
			items.push({ id: I.ParticipantPermissions.Reader });
		};
		if (membership.isExplorer || (U.Space.getWriterLimit() - 1 >= 0)) {
			items.push({ id: I.ParticipantPermissions.Writer });
		};

		items = items.map(it => {
			it.name = translate(`participantPermissions${it.id}`);
			return it;
		});

		if (items.length) {
			items.push({ isDiv: true });
		};

		items.push({ id: 'remove', name: translate('popupSettingsSpaceShareRemoveMember'), color: 'red' });

		return items;
	};

	onPermissionsSelect (item: any) {
		S.Menu.open('select', {
			element: `#item-${item.id}-select`,
			horizontal: I.MenuDirection.Right,
			data: {
				value: item.permissions,
				options: this.getParticipantOptions(),
				onSelect: (e: any, el: any) => {
					this.onChangePermissions(item, el.id);
				},
			},
		});
	};

	onChangePermissions (item: any, v: any) {
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
					C.SpaceParticipantRemove(space, [ item.identity ]);

					analytics.event('RemoveSpaceMember');
				};
				break;
			};

			default: {
				v = Number(v) || I.ParticipantPermissions.Reader;

				title = translate('commonAreYouSure');
				text = U.Common.sprintf(translate('popupConfirmMemberChangeText'), item.name, translate(`participantPermissions${v}`));

				onConfirm = () => {
					C.SpaceParticipantPermissionsChange(space, [ { identity: item.identity, permissions: Number(v) } ]);

					analytics.event('ChangeSpaceMemberPermissions', { type: v });
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

	onInfo () {
		S.Popup.open('confirm', {
			className: 'isLeft shareMoreInfo',
			data: {
				title: translate('popupConfirmSpaceShareMoreInfoTitle'),
				text: translate('popupConfirmSpaceShareMoreInfoText'),
				textConfirm: translate('commonOk'),
				canCancel: false,
			},
		});

		analytics.event('ClickSettingsSpaceShare', { type: 'MoreInfo' });
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

	onLeaveRequest (item: any) {
		Action.leaveApprove(S.Common.space, [ item.identity ], item.name, analytics.route.settings);
	};

	onMoreSpace () {
		const { getId } = this.props;
		const options = [
			{ id: 'stop-sharing', color: 'red', name: translate('popupSettingsSpaceShareStopSharing') },
		];

		S.Menu.open('select', {
			element: `#${getId()} #button-more-space`,
			horizontal: I.MenuDirection.Right,
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'stop-sharing': {
							this.onStopSharing();
							break;
						};
					};
				},
			}
		});
	};

	onMoreLink () {
		const { getId } = this.props;
		const { cid, key } = this.state;

		U.Menu.inviteContext({
			containerId: getId(),
			cid,
			key,
			onInviteRevoke: () => this.setInvite('', ''),
		});
	};

	setError (error: { description: string, code: number}) {
		if (!error.code) {
			return false;
		};

		this.setState({ error: error.description });
		return true;
	};

	resize () {
		if (this.refList) {
			this.refList.recomputeRowHeights(0);
		};
	};

});

export default PageMainSettingsSpaceShare;
