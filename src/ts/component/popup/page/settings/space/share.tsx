import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, Label, Icon, Input, Button, IconObject, ObjectName, Tag, Error, Loader } from 'Component';
import { I, C, translate, UtilCommon, UtilSpace, Preview, Action, analytics, UtilObject, UtilMenu } from 'Lib';
import { authStore, popupStore, commonStore, menuStore } from 'Store';
import { AutoSizer, WindowScroller, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import Head from '../head';

interface State {
	isLoading: boolean;
	error: string;
	cid: string;
	key: string;
};

const HEIGHT = 64;

const PopupSettingsSpaceShare = observer(class PopupSettingsSpaceShare extends React.Component<I.PopupSettings, State> {

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

	constructor (props: I.PopupSettings) {
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

		const { membership } = authStore;
		const hasLink = cid && key;
		const space = UtilSpace.getSpaceview();
		const participant = UtilSpace.getParticipant();
		const members = this.getParticipantList();
		const length = members.length;
		const isShareActive = UtilSpace.isShareActive();

		let limitLabel = '';
		let limitButton = '';
		let showLimit = false;

		if (space.isShared) {
			if (!UtilSpace.getWriterLimit()) {
				limitLabel = translate('popupSettingsSpaceShareInvitesWriterLimitReachedLabel');
				limitButton = translate('popupSettingsSpaceShareInvitesWriterLimitReachedButton');
				showLimit = true;
			} else
			if (!UtilSpace.getReaderLimit() && membership.isExplorer) {
				limitLabel = translate('popupSettingsSpaceShareInvitesReaderLimitReachedLabel');
				limitButton = translate('popupSettingsSpaceShareInvitesReaderLimitReachedButton');
				showLimit = true;
			};
		};

		const Member = (item: any) => {
			const isCurrent = item.id == participant.id;

			let tag = null;
			let button = null;

			if (item.isJoining) {
				tag = <Tag text={translate('popupSettingsSpaceShareJoinRequest')} />;
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
				tag = <Tag text={translate('popupSettingsSpaceShareLeaveRequest')} />;
				button = (
					<Button
						className="c36"
						color="blank"
						text={translate('commonApprove')}
						onClick={() => this.onLeaveRequest(item)}
					/>
				);
			} else 
			if (item.isDeclined || item.isRemoved) {
				button = <Label color="red" text={translate(`participantStatus${item.status}`)} />;
			} else
			if (item.isOwner) {
				button = <Label color="grey" text={translate(`participantPermissions${I.ParticipantPermissions.Owner}`)} />;
			} else {
				button = (
					<div id={`item-${item.id}-select`} className="select" onClick={() => this.onPermissionsSelect(item)}>
						<div className="item">
							<div className="name">{translate(`participantPermissions${item.permissions}`)}</div>
						</div>
						<Icon className="arrow light" />
					</div>
				);
			};
		
			return (
				<div id={`item-${item.id}`} className="row" style={item.style} >
					<div className="side left" onClick={() => UtilObject.openPopup(item)}>
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
				<Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />

				<div id="titleWrapper" className="titleWrapper">
					<Title text={translate('popupSettingsSpaceShareTitle')} />

					<div className="icons">
						<Icon className="question" onClick={this.onInfo} />
						{space.isShared ? <Icon id="button-more-space" className="more" onClick={this.onMoreSpace} /> : ''}
					</div>
				</div>

				<div id="sectionInvite" className="section sectionInvite">
					<Title text={translate('popupSettingsSpaceShareInviteLinkTitle')} />
					<Label text={translate('popupSettingsSpaceShareInviteLinkLabel')} />

					{hasLink ? (
						<div className="inviteLinkWrapper">
							<div className="inputWrapper">
								<Input ref={ref => this.refInput = ref} readonly={true} value={UtilSpace.getInviteLink(cid, key)} onClick={() => this.refInput?.select()} />
								<Icon id="button-more-link" className="more" onClick={this.onMoreLink} />
							</div>
							<Button ref={ref => this.refCopy = ref} onClick={this.onCopy} className="c40" color="blank" text={translate('commonCopyLink')} />
						</div>
					) : (
						<div className="buttons">
							<Button 
								ref={ref => this.refButton = ref} 
								onClick={isShareActive ? () => this.onInitLink() : null} 
								className={[ 'c40', (isShareActive ? '' : 'disabled') ].join(' ')} 
								tooltip={isShareActive ? '' : translate('popupSettingsSpaceShareGenerateInviteDisabled')}
								text={translate('popupSettingsSpaceShareGenerateInvite')} 
							/>
						</div>
					)}
				</div>

				<div id="sectionMembers" className="section sectionMembers">
					<Title text={translate('popupSettingsSpaceShareMembersTitle')} />

					{showLimit ? (
						<div className="row payment">
							<Label text={limitLabel} />
							<Button className="payment" text={limitButton} onClick={this.onUpgrade} />
						</div>
					) : ''}

					{this.cache ? (
						<div id="list" className="rows">
							<WindowScroller scrollElement={$('#popupSettings-innerWrap .mainSides #sideRight').get(0)}>
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

		this.setState({ isLoading: true });

		C.SpaceInviteGetCurrent(commonStore.space, (message: any) => {
			this.setState({ isLoading: false });

			if (!message.error.code) {
				this.setInvite(message.inviteCid, message.inviteKey);
			};
		});
	};

	componentDidUpdate() {
		this.resize();
	};

	setInvite (cid: string, key: string) {
		this.setState({ cid, key });
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	onUpgrade () {
		const { membership } = authStore;

		if (membership.tier >= I.TierType.Builder) {
			Action.membershipUpgrade();
		} else {
			this.props.close(() => {
				popupStore.open('settings', { data: { page: 'membership' } });
			});
		};

		analytics.event('ClickUpgradePlanTooltip', { type: 'members', route: analytics.route.settingsSpaceShare });
	};

	getParticipantList () {
		const records = UtilSpace.getParticipantsList([ I.ParticipantStatus.Joining, I.ParticipantStatus.Removing, I.ParticipantStatus.Active ]);

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

		UtilCommon.copyToast('', UtilSpace.getInviteLink(cid, key), translate('toastInviteCopy'));
		analytics.event('ClickShareSpaceCopyLink');
	};

	onInitLink () {
		this.refButton?.setLoading(true);

		C.SpaceMakeShareable(commonStore.space, (message: any) => {
			if (this.setError(message.error)) {
				this.refButton?.setLoading(false);
				return;
			};

			C.SpaceInviteGenerate(commonStore.space, (message: any) => {
				this.refButton?.setLoading(false);

				if (!this.setError(message.error)) {
					this.setInvite(message.inviteCid, message.inviteKey);

					Preview.toastShow({ text: translate('toastInviteGenerate') });
					analytics.event('ShareSpace');
				};
			});
		});
	};

	onStopSharing () {
		popupStore.open('confirm', {
			data: {
				title: translate('popupConfirmStopSharingSpaceTitle'),
				text: translate('popupConfirmStopSharingSpaceText'),
				textConfirm: translate('popupConfirmStopSharingSpaceConfirm'),
				colorConfirm: 'red',
				onConfirm: () => {
					C.SpaceStopSharing(commonStore.space);
					this.setInvite('', '');

					analytics.event('StopSpaceShare');
				},
			},
		});

		analytics.event('ScreenStopShare');
	};

	getParticipantOptions () {
		const { membership } = authStore;

		let items: any[] = [] as any[];

		if (membership.isExplorer || (UtilSpace.getReaderLimit() - 1 >= 0)) {
			items.push({ id: I.ParticipantPermissions.Reader });
		};
		if (membership.isExplorer || (UtilSpace.getWriterLimit() - 1 >= 0)) {
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
		menuStore.open('select', {
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
		const { space } = commonStore;

		let title = '';
		let text = '';
		let button = '';
		let onConfirm = null;

		switch (v) {
			case 'remove': {
				title = translate('popupConfirmMemberRemoveTitle');
				text = UtilCommon.sprintf(translate('popupConfirmMemberRemoveText'), item.name);
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
				text = UtilCommon.sprintf(translate('popupConfirmMemberChangeText'), item.name, translate(`participantPermissions${v}`));

				onConfirm = () => {
					C.SpaceParticipantPermissionsChange(space, [ { identity: item.identity, permissions: Number(v) } ]);

					analytics.event('ChangeSpaceMemberPermissions', { type: v })
				};
				break;
			};
		};

		popupStore.open('confirm', {
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
		popupStore.open('confirm', {
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
		popupStore.open('inviteConfirm', { 
			data: {
				name: item.name,
				icon: item.iconImage,
				spaceId: commonStore.space,
				identity: item.identity,
				route: analytics.route.settings,
			}
		});
	};

	onLeaveRequest (item: any) {
		Action.leaveApprove(commonStore.space, [ item.identity ], item.name, analytics.route.settings);
	};

	onMoreSpace () {
		const { getId } = this.props;
		const options = [
			{ id: 'stop-sharing', color: 'red', name: translate('popupSettingsSpaceShareStopSharing') },
		];

		menuStore.open('select', {
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

		UtilMenu.inviteContext({
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
		const { position, getId } = this.props;
		const node = $(this.node);
		const obj = $(`#${getId()}-innerWrap`);
		const head = node.find('.head')
		const titleWrapper = node.find('#titleWrapper');
		const sectionInvite = node.find('#sectionInvite');
		const sectionMember = node.find('#sectionMembers');
		const buttons = node.find('#buttons');
		const mh = obj.height() - head.outerHeight(true) - titleWrapper.outerHeight(true) - sectionInvite.outerHeight(true) - buttons.outerHeight(true) - 80;

		sectionMember.css({ minHeight: mh });

		if (this.refList) {
			this.refList.recomputeRowHeights(0);
		};

		position();
	};

});

export default PopupSettingsSpaceShare;
