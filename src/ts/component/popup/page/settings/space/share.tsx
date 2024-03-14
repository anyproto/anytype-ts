import * as React from 'react';
import $ from 'jquery';
import { Title, Label, Icon, Input, Button, IconObject, ObjectName, Select, Tag, Error } from 'Component';
import { I, C, translate, UtilCommon, UtilObject, UtilData, Preview } from 'Lib';
import { observer } from 'mobx-react';
import { dbStore, detailStore, popupStore, commonStore, menuStore } from 'Store';
import { AutoSizer, WindowScroller, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import Head from '../head';
import Constant from 'json/constant.json';

interface State {
	error: string;
	cid: string;
	key: string;
};

const HEIGHT = 64;
const MEMBER_LIMIT = 10;

const PopupSettingsSpaceShare = observer(class PopupSettingsSpaceShare extends React.Component<I.PopupSettings, State> {

	node: any = null;
	cache: any = null;
	top = 0;
	refInput = null;
	refList: any = null;
	refCopy: any = null;
	refButton: any = null;
	state = {
		error: '',
		cid: '',
		key: '',
	};

	constructor (props: I.PopupSettings) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onInviteRevoke = this.onInviteRevoke.bind(this);
		this.onInitLink = this.onInitLink.bind(this);
		this.onStopSharing = this.onStopSharing.bind(this);
		this.onChangePermissions = this.onChangePermissions.bind(this);
		this.onInfo = this.onInfo.bind(this);
		this.onMoreSpace = this.onMoreSpace.bind(this);
		this.onMoreLink = this.onMoreLink.bind(this);
	};

	render () {
		const { error, cid, key } = this.state;
		const isShared = cid && key;
		const participant = UtilObject.getParticipant();
		const members = this.getMembers();
		const memberOptions = this.getMemberOptions();
		const length = members.length;

		const Member = (item: any) => {
			const isActive = item.id == participant.id;
			const isOwner = item.permissions == I.ParticipantPermissions.Owner;
			const isJoining = [ I.ParticipantStatus.Joining ].includes(item.status);
			const isDeclined = [ I.ParticipantStatus.Declined ].includes(item.status);
			const isRemoving = [ I.ParticipantStatus.Removing ].includes(item.status);
			const isRemoved = [ I.ParticipantStatus.Removed ].includes(item.status);

			let tag = null;
			let button = null;

			if (isJoining) {
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
			if (isRemoving) {
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
			if (isDeclined || isRemoved) {
				button = <Label color="red" text={translate(`participantStatus${item.status}`)} />;
			} else
			if (isOwner) {
				button = <Label text={translate(`participantPermissions${I.ParticipantPermissions.Owner}`)} />;
			} else {
				button = (
					<Select
						id={`item-${item.id}-select`}
						value={item.permissions}
						options={memberOptions}
						arrowClassName="light"
						menuParam={{ horizontal: I.MenuDirection.Right }}
						onChange={v => this.onChangePermissions(item, v)}
					/>
				);
			};
		
			return (
				<div id={`item-${item.id}`} className="row" style={item.style} >
					<div className="side left">
						<IconObject size={48} object={item} />
						<ObjectName object={item} />
						{tag}
						{isActive ? <div className="caption">({translate('commonYou')})</div> : ''}
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
						{isShared ? (
							<Icon id="button-more-space" className="more" onClick={this.onMoreSpace} />
						) : ''}
					</div>
				</div>

				<div id="sectionInvite" className="section sectionInvite">
					<Title text={translate('popupSettingsSpaceShareInviteLinkTitle')} />
					<Label text={translate('popupSettingsSpaceShareInviteLinkLabel')} />

					{isShared ? (
						<React.Fragment>
							<div className="inviteLinkWrapper">
								<div className="inputWrapper">
									<Input ref={ref => this.refInput = ref} readonly={true} value={this.getLink()} />
									<Icon id="button-more-link" className="more" onClick={this.onMoreLink} />
								</div>
								<Button ref={ref => this.refCopy = ref} onClick={this.onCopy} className="c40" color="blank" text={translate('commonCopyLink')} />
							</div>

							<div className="invitesLimit">
								{UtilCommon.sprintf(translate('popupSettingsSpaceShareInvitesLimit'), MEMBER_LIMIT, UtilCommon.plural(MEMBER_LIMIT, translate('pluralMember')))}
							</div>
						</React.Fragment>
					) : (
						<div className="buttons">
							<Button 
								ref={ref => this.refButton = ref} 
								onClick={this.onInitLink} 
								className="c40" 
								text={translate('popupSettingsSpaceShareGenerateInvite')} 
							/>
						</div>
					)}
				</div>

				<div id="sectionMembers" className="section sectionMembers">
					<Title text={translate('popupSettingsSpaceShareMembersTitle')} />

					{this.cache ? (
						<div id="list" className="rows">
							<WindowScroller scrollElement={$('#popupSettings-innerWrap').get(0)}>
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
		this.updateCache();

		C.SpaceInviteGetCurrent(commonStore.space, (message: any) => {
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

	updateCache () {
		const members = this.getMembers();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (members[i] || {}).id,
		});
		this.forceUpdate();
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getMembers () {
		const subId = Constant.subId.participant;
		const statuses = [ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ];
		const records = dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id)).filter(it => statuses.includes(it.status));

		return records.sort(UtilData.sortByOwner);
	};

	getLink () {
		const { cid, key } = this.state;
		return `${Constant.protocol}://invite/?cid=${cid}&key=${key}`
	};

	onCopy () {
		const { cid, key } = this.state;

		if (cid && key) {
			UtilCommon.copyToast('', this.getLink(), translate('toastInviteCopy'));
		};
	};

	onInitLink () {
		const { space } = commonStore;

		this.refButton?.setLoading(true);

		C.SpaceInviteGenerate(space, (message: any) => {
			this.refButton?.setLoading(false);

			if (!this.setError(message.error)) {
				this.setInvite(message.inviteCid, message.inviteKey);

				Preview.toastShow({ text: translate('toastInviteGenerate') });
			};
		});
	};

	onStopSharing () {
		const { space } = commonStore;

		popupStore.open('confirm', {
			data: {
				title: translate('popupConfirmStopSharingSpaceTitle'),
				text: translate('popupConfirmStopSharingSpaceText'),
				textConfirm: translate('popupConfirmStopSharingSpaceConfirm'),
				colorConfirm: 'red',
				onConfirm: () => {
					C.SpaceStopSharing(space);
					this.setInvite('', '');
				},
			},
		});
	};

	onInviteRevoke () {
		const { space } = commonStore;

		popupStore.open('confirm', {
			data: {
				title: translate('popupConfirmRevokeLinkTitle'),
				text: translate('popupConfirmRevokeLinkText'),
				textConfirm: translate('popupConfirmRevokeLinkConfirm'),
				colorConfirm: 'red',
				onConfirm: () => {
					C.SpaceInviteRevoke(space, (message: any) => {
						this.setInvite('', '');

						Preview.toastShow({ text: translate('toastInviteRevoke') });
					});
				},
			},
		});
	};

	getMemberOptions () {
		let items: any[] = ([
			{ id: I.ParticipantPermissions.Reader },
			{ id: I.ParticipantPermissions.Writer },
		] as any[]).map(it => {
			it.name = translate(`participantPermissions${it.id}`);
			return it;
		});

		return items.concat([
			{ id: '', name: '', isDiv: true },
			{ id: 'remove', name: translate('popupSettingsSpaceShareRemoveMember'), color: 'red' }
		]);
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
				};
				break;
			};

			default: {
				v = Number(v) || I.ParticipantPermissions.Reader;

				title = translate('popupConfirmMemberChangeTitle');
				text = UtilCommon.sprintf(translate('popupConfirmMemberChangeText'), item.name, translate(`participantPermissions${v}`));

				onConfirm = () => {
					C.SpaceParticipantPermissionsChange(space, [ { identity: item.identity, permissions: Number(v) } ]);
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
	};

	onJoinRequest (item: any) {
		popupStore.open('inviteConfirm', { 
			data: {
				name: item.name,
				icon: item.iconImage,
				spaceId: commonStore.space,
				identity: item.identity,
			}
		});
	};

	onLeaveRequest (item: any) {
		C.SpaceParticipantRemove(commonStore.space, [ item.identity ], () => {
			Preview.toastShow({ text: UtilCommon.sprintf(translate('toastApproveLeaveRequest'), item.name) });
		});
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
		const options = [
			{ id: 'qr', name: translate('popupSettingsSpaceShareShowQR') },
			{ id: 'delete', color: 'red', name: translate('popupSettingsSpaceShareRevokeInvite') },
		];

		menuStore.open('select', {
			element: `#${getId()} #button-more-link`,
			horizontal: I.MenuDirection.Center,
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'qr': {
							break;
						};

						case 'delete': {
							this.onInviteRevoke();
							break;
						};
					};
				},
			}
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
