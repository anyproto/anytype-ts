import React, { forwardRef, useRef, useEffect, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Select, IconObject, ObjectName, Button, Editable } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Action } from 'Lib';
import MemberCnt from 'Component/util/memberCnt';

const PageMainSettingsSpaceIndex = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const [ isEditing, setIsEditing ] = useState(false);
	const [ invite, setInvite ] = useState({ cid: '', key: '' });
	const [ dummy, setDummy ] = useState(0);
	const { getId } = props;
	const { config, space } = S.Common;
	const spaceview = U.Space.getSpaceview();
	const home = U.Space.getDashboard();
	const type = S.Record.getTypeById(S.Common.type);
	const participant = U.Space.getParticipant();
	const canWrite = U.Space.canMyParticipantWrite();
	const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
	const isOwner = U.Space.isMyOwner();
	const cnh = [ 'spaceHeader' ];
	const nodeRef = useRef(null);
	const nameRef = useRef(null);
	const uxTypeRef = useRef(null);
	const modeRef = useRef(null);
	const canSaveRef = useRef(true);

	if (isEditing) {
		cnh.push('isEditing');
	};

	const setName = () => {
		nameRef.current?.setValue(checkName(spaceview.name));
		nameRef.current?.placeholderCheck();
	};

	const init = () => {
		const win = $(window);

		if (spaceview.isShared && !invite.cid && !invite.key) {
			U.Space.getInvite(S.Common.space, (cid: string, key: string) => {
				if (cid && key) {
					setInvite({ cid, key });
				};
			});
		};

		win.off('keydown.settingsSpace');

		if (isEditing) {
			win.on('keydown.settingsSpace', (e: any) => {
				keyboard.shortcut('enter', e, () => onSave());
				keyboard.shortcut('escape', e, () => onCancel());
			});
		};

		modeRef.current?.setValue(String(spaceview.notificationMode));
		modeRef.current?.setValue(String(spaceview.uxType));
	};

	const onKeyUp = () => {
		nameRef.current?.placeholderCheck();
		updateCounters();
	};

	const onDashboard = () => {
		if (!spaceview.isChat && !spaceview.isOneToOne) {
			U.Menu.dashboardSelect(`#${getId()} #empty-dashboard-select`);
		};
	};

	const onType = (e: any) => {
		S.Menu.open('typeSuggest', {
			element: `#${getId()} #defaultType`,
			horizontal: I.MenuDirection.Right,
			data: {
				canAdd: true,
				filter: '',
				filters: [
					{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
					{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
				],
				onClick: (item: any) => {
					S.Common.typeSet(item.uniqueKey);
					analytics.event('DefaultTypeChange', { objectType: item.uniqueKey, route: analytics.route.settings });
					setDummy(dummy + 1);
				},
			}
		});
	};

	const onSelect = (icon: string) => {
		if (!icon) {
			C.WorkspaceSetInfo(space, { iconImage: '' });
		};
	};

	const onUpload = (objectId: string) => {
		C.WorkspaceSetInfo(space, { iconImage: objectId });
	};

	const onClick = (e: React.MouseEvent, item: any) => {
		if (item.isDisabled) {
			return;
		};

		switch (item.id) {
			case 'invite': {
				Action.openSpaceShare(analytics.route.settingsSpace);
				analytics.event('ClickSettingsSpaceInvite', { route: analytics.route.settingsSpace });
				break;
			};

			case 'qr': {
				S.Popup.open('inviteQr', { data: { link: U.Space.getInviteLink(invite.cid, invite.key) } });
				analytics.event('ScreenQr', { route: analytics.route.settingsSpace });
				break;
			};

			case 'copyLink': {
				U.Common.copyToast('', U.Space.getInviteLink(invite.cid, invite.key), translate('toastInviteCopy'));
				analytics.event('ClickShareSpaceCopyLink', { route: analytics.route.settingsSpaceIndex });
				break;
			};
		};
	};

	const onEdit = () => {
		setIsEditing(true);
		nameRef.current?.setFocus();
		updateCounters();
	};

	const onSave = () => {
		if (!canSaveRef.current) {
			return;
		};

		C.WorkspaceSetInfo(S.Common.space, { name: checkName(nameRef.current?.getTextValue()) });
		onCancel();
	};

	const onCancel = () => {
		setIsEditing(false);
	};

	const onSpaceUxType = (v) => {
		v = Number(v);

		const onCancel = () => {
			uxTypeRef.current?.setValue(spaceview.uxType);
		};

		S.Popup.open('confirm', {
			onClose: onCancel,
			data: {
				icon: 'warning-red',
				title: translate('popupConfirmUxTypeChangeTitle'),
				text: translate('popupConfirmUxTypeChangeText'),
				textConfirm: translate('popupConfirmUxTypeChangeConfirm'),
				colorConfirm: 'red',
				onConfirm: () => {
					const details: any = {
						spaceUxType: v,
						spaceDashboardId: (v == I.SpaceUxType.Chat || v == I.SpaceUxType.OneToOne ? I.HomePredefinedId.Chat : I.HomePredefinedId.Last),
					};

					C.WorkspaceSetInfo(S.Common.space, details);
					analytics.event('ChangeSpaceUxType', { type: v, route: analytics.route.settingsSpaceIndex });
				},
				onCancel,
			},
		});
	};

	const checkName = (v: string): string => {
		if ([ 
			translate('defaultNameSpace'), 
			translate('defaultNamePage'),
		].includes(v)) {
			v = '';
		};
		return v;
	};

	const getButtons = (): any[] => {
		if (!invite.cid || !invite.key) {
			return [];
		};

		return [
			{ id: 'invite', name: translate('commonAdd'), icon: 'invite' },
			{ id: 'copyLink', name: translate('pageSettingsSpaceIndexCopyLink'), icon: 'copyLink' },
			{ id: 'qr', name: translate('pageSettingsSpaceIndexQRCode'), icon: 'qr' },
		];
	};

	const updateCounters = () => {
		const node = $(nodeRef.current);
		const { name, nameThreshold } = J.Constant.limit.space;
		const el = node.find('.spaceNameWrapper .counter');
		const counter = name - nameRef.current?.getTextValue().length;
		const canSave = counter >= 0;

		el.text(counter).toggleClass('show', counter <= nameThreshold);
		el.toggleClass('red', !canSave);

		canSaveRef.current = canSave;
		node.find('.spaceHeader .buttonSave').toggleClass('disabled', !canSave);
	};

	const buttons = getButtons();

	let headerButtons = [];
	if (!spaceview.isOneToOne) {
		if (isEditing) {
			headerButtons = headerButtons.concat([
				{ color: 'blank', text: translate('commonCancel'), onClick: onCancel },
				{ color: 'black', text: translate('commonSave'), onClick: onSave, className: 'buttonSave' },
			]);
		} else {
			headerButtons = headerButtons.concat([
				{ color: 'blank', text: translate('pageSettingsSpaceIndexEdit'), onClick: onEdit },
			]);
		}
	};
	
	const Member = (item: any) => {
		const isCurrent = item.id == participant?.id;

		return (
			<div className="member" style={item.style} >
				<div className="side left">
					<IconObject size={48} object={item} />
					<div className="nameWrapper">
						<div className="memberName">
							<ObjectName object={item} />
							{isCurrent ? <div className="caption">({translate('commonYou')})</div> : ''}
						</div>
						{item.globalName ? <Label className="globalName" text={item.globalName} /> : ''}
					</div>

				</div>
				<div className="side right">
					<Label text={translate(`participantPermissions${item.permissions}`)} />
				</div>
			</div>
		);
	};

	useEffect(() => {
		setName();
		init();

		return () => {
			S.Menu.closeAll([ 'select', 'searchObject' ]);
		};
	});

	useEffect(() => {
		setName();
		init();
	});

	return (
		<div ref={nodeRef}>
			<div className={cnh.join(' ')}>
				{canWrite ? (
					<div className="buttons">
						{headerButtons.map((el, idx) => (
							<Button 
								{...el}
								className={[ 'c28', (el.className ? el.className : '') ].join(' ')} 
								key={idx} 
							/>
						))}
					</div>
				) : ''}

				<IconObject
					id="space-icon"
					size={96}
					iconSize={96}
					object={{ ...spaceview, spaceId: S.Common.space }}
					canEdit={canWrite && !spaceview.isOneToOne}
					menuParam={{ 
						horizontal: I.MenuDirection.Center,
						classNameWrap: 'fromBlock',
					}}
					onSelect={onSelect}
					onUpload={onUpload}
				/>

				<div className="spaceNameWrapper">
					<Editable
						classNameWrap="spaceName"
						ref={nameRef}
						placeholder={translate('defaultNamePage')}
						readonly={!canWrite || !isEditing}
						onKeyUp={onKeyUp}
						maxLength={J.Constant.limit.space.name}
					/>
					<div className="counter" />
				</div>

				<MemberCnt route={analytics.route.settings} />
			</div>

			<div className="spaceButtons">
				{buttons.map((item, i) => (
					<div 
						key={i} 
						id={U.String.toCamelCase(`settingsSpaceButton-${item.id}`)} 
						className="btn" 
						onClick={e => onClick(e, item)}
					>
						<Icon className={item.icon} />
						<Label text={item.name} />
					</div>
				))}
			</div>

			<div className="sections">
				{canWrite ? (
					<>
						<div className="section sectionSpaceManager">
							<Label className="sub" text={translate(`popupSettingsSpaceIndexManageSpaceTitle`)} />

							{isOwner && spaceview.isShared && !spaceview.isPersonal && config.sudo ? (
								<div className="sectionContent">
									<div className="item">
										<div className="sides">
											<Icon className={`settings-ux${spaceview.uxType}`} />

											<div className="side left">
												<Title text={translate('popupSettingsSpaceIndexUxTypeTitle')} />
												<Label text={translate('popupSettingsSpaceIndexUxTypeText')} />
											</div>

											<div className="side right">
												<Select
													id="uxType"
													readonly={!canWrite}
													ref={uxTypeRef}
													value={String(spaceview.uxType)}
													options={U.Menu.uxTypeOptions()}
													onChange={onSpaceUxType}
													arrowClassName="black"
													menuParam={{ horizontal: I.MenuDirection.Right }}
												/>
											</div>
										</div>
									</div>
								</div>
							) : ''}

							<div className="sectionContent">
								{!spaceview.isChat && !spaceview.isOneToOne ? (
									<div className="item">
										<div className="sides">
											<Icon className="home" />

											<div className="side left">
												<Title text={translate('commonHomepage')} />
												<Label text={translate('popupSettingsSpaceIndexHomepageDescription')} />
											</div>

											<div className="side right">
												<div id="empty-dashboard-select" className="select" onClick={onDashboard}>
													<div className="item">
														<div className="name">{home ? home.name : translate('commonSelect')}</div>
													</div>
													<Icon className="arrow black" />
												</div>
											</div>
										</div>
									</div>
								) : ''}

								<div className="item">
									<div className="sides">
										<Icon className="type" />

										<div className="side left">
											<Title text={translate('popupSettingsPersonalDefaultObjectType')} />
											<Label text={translate('popupSettingsPersonalDefaultObjectTypeDescription')} />
										</div>

										<div className="side right">
											<div id="defaultType" className="select" onClick={onType}>
												<div className="item">
													<div className="name">{type?.name || translate('commonSelect')}</div>
												</div>
												<Icon className="arrow black" />
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</>
				) : (
					<div className="membersList section">
						<Label className="sub" text={translate(`pageSettingsSpaceIndexSpaceMembers`)} />
						{members.map((el, idx) => (
							<Member {...el} key={idx} />
						))}
					</div>
				)}
			</div>
		</div>
	);

}));

export default PageMainSettingsSpaceIndex;