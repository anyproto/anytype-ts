import React, { forwardRef, useRef, useEffect, useState, MouseEvent } from 'react';
import { Icon, Title, Label, IconObject, ObjectName, ObjectDescription, Button, Editable } from 'Component';
import MemberCnt from 'Component/util/memberCnt';
import * as I from 'Interface';

const PageMainSettingsSpaceIndex = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const [ isEditing, setIsEditing ] = useState(false);
	const [ invite, setInvite ] = useState({ cid: '', key: '' });
	const [ dummy, setDummy ] = useState(0);
	const { getId } = props;
	const { space, sidebarView } = S.Common;
	const sidebarViewName = sidebarView == I.SidebarView.Links ? translate('menuSidebarViewLinks') : translate('menuSidebarViewWidgets');
	const spaceview = U.Space.getSpaceview();
	const home = U.Space.getDashboard();
	const type = S.Record.getTypeById(S.Common.type);
	const participant = U.Space.getParticipant();
	const canWrite = U.Space.canMyParticipantWrite();
	const canModerate = U.Space.canMyParticipantModerate();
	const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
	const otherParticipant = spaceview.isOneToOne ? U.Space.getOneToOneParticipant(spaceview) : null;
	const cnh = [ 'spaceHeader' ];
	const nodeRef = useRef(null);
	const nameRef = useRef(null);
	const modeRef = useRef(null);
	const canSaveRef = useRef(true);
	const keydownHandlerRef = useRef<((e: any) => void) | null>(null);

	if (isEditing) {
		cnh.push('isEditing');
	};

	const setName = () => {
		nameRef.current?.setValue(checkName(spaceview.name));
		nameRef.current?.placeholderCheck();
	};

	const init = () => {
		if (spaceview.isShared && !invite.cid && !invite.key) {
			U.Space.getInvite(S.Common.space, (cid: string, key: string) => {
				if (cid && key) {
					setInvite({ cid, key });
				};
			});
		};

		if (keydownHandlerRef.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandlerRef.current);
			keydownHandlerRef.current = null;
		};

		if (isEditing) {
			keydownHandlerRef.current = (e: any) => {
				keyboard.shortcut('enter', e, () => onSave());
				keyboard.shortcut('escape', e, () => onCancel());
			};
			U.Dom.addEvent(window, 'keydown', keydownHandlerRef.current);
		};

		modeRef.current?.setValue(String(spaceview.notificationMode));
		modeRef.current?.setValue(String(spaceview.spaceType));
	};

	const onKeyUp = () => {
		nameRef.current?.placeholderCheck();
		updateCounters();
	};

	const onDashboard = () => {
		if (!spaceview.isOneToOne) {
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

	const onSidebarView = () => {
		S.Menu.open('select', {
			element: `#${getId()} #sidebarView`,
			horizontal: I.MenuDirection.Right,
			data: {
				value: sidebarView,
				options: [
					{ id: I.SidebarView.Links, name: translate('menuSidebarViewLinks') },
					{ id: I.SidebarView.Widgets, name: translate('menuSidebarViewWidgets') },
				],
				onSelect: (_: any, option: any) => {
					S.Common.sidebarViewSet(option.id);
					analytics.event('ChangeSidebarView', { type: option.id, route: analytics.route.settings });
				},
			},
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

	const onClick = (e: MouseEvent, item: any) => {
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
		if (spaceview.isOneToOne) {
			return [];
		};

		return [
			{ id: 'invite', iconParam: { name: 'publish/member' }, name: translate('commonInvite') },
			{ id: 'copyLink', iconParam: { name: 'menu/action/copyLink' }, name: translate('pageSettingsSpaceIndexCopyLink') },
			{ id: 'qr', iconParam: { name: 'common/qr' }, name: translate('pageSettingsSpaceIndexQRCode') },
		].map((el: any) => {
			el.isDisabled = !invite.cid || !invite.key;
			return el;
		});
	};

	const updateCounters = () => {
		const node = nodeRef.current;
		const { name, nameThreshold } = J.Constant.limit.space;
		const el = U.Dom.select('.spaceNameWrapper .counter', node);
		const counter = name - nameRef.current?.getTextValue().length;
		const canSave = counter >= 0;

		if (el) {
			el.textContent = String(counter);
			U.Dom.toggleClass(el, 'show', counter <= nameThreshold);
			U.Dom.toggleClass(el, 'red', !canSave);
		};

		canSaveRef.current = canSave;
		const saveBtn = U.Dom.select('.spaceHeader .buttonSave', node);
		U.Dom.toggleClass(saveBtn, 'disabled', !canSave);
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
			if (keydownHandlerRef.current) {
				U.Dom.removeEvent(window, 'keydown', keydownHandlerRef.current);
				keydownHandlerRef.current = null;
			};
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

				{spaceview.isOneToOne && otherParticipant ? (
					<ObjectDescription className="userDescription" object={otherParticipant} />
				) : ''}

				<MemberCnt route={analytics.route.settings} />
			</div>

			{buttons.length ? (
				<div className="spaceButtons">
					{buttons.map((item, i) => (
						<div
							key={i}
							id={U.String.toCamelCase(`settingsSpaceButton-${item.id}`)}
							className={[ 'btn', (item.isDisabled ? 'disabled' : '') ].join(' ')}
							onClick={e => onClick(e, item)}
						>
							<Icon {...(item.iconParam || {})} className={item.id} />
							<Label text={item.name} />
						</div>
					))}
				</div>
			) : ''}

			<div className="sections">
				{canWrite ? (
					<>
						<div className="section sectionSpaceManager">
							<Label className="sub" text={translate(`popupSettingsSpaceIndexManageSpaceTitle`)} />

							<div className="sectionContent">
								{!spaceview.isOneToOne && canModerate ? (
									<div className="item">
										<div className="sides">
											<Icon name="settings/home" />

											<div className="side left">
												<Title text={translate('commonHomepage')} />
												<Label text={translate('popupSettingsSpaceIndexHomepageDescription')} />
											</div>

											<div className="side right">
												<div id="empty-dashboard-select" className="select" onClick={onDashboard}>
													<div className="item">
														{home ? <ObjectName object={home} withPlural={true} /> : translate('commonSelect')}
													</div>
													<Icon name="arrow/button" className="arrow black" width={6} height={10} />
												</div>
											</div>
										</div>
									</div>
								) : ''}

								<div className="item">
									<div className="sides">
										<Icon name="settings/sidebarView" />

										<div className="side left">
											<Title text={translate('popupSettingsSpaceIndexSidebarViewTitle')} />
											<Label text={translate('popupSettingsSpaceIndexSidebarViewDescription')} />
										</div>

										<div className="side right">
											<div id="sidebarView" className="select" onClick={onSidebarView}>
												<div className="item">
													<div className="name">{sidebarViewName}</div>
												</div>
												<Icon name="arrow/button" className="arrow black" width={6} height={10} />
											</div>
										</div>
									</div>
								</div>

								<div className="item">
									<div className="sides">
										<Icon name="settings/type" className="type" />

										<div className="side left">
											<Title text={translate('popupSettingsPersonalDefaultObjectType')} />
											<Label text={translate('popupSettingsPersonalDefaultObjectTypeDescription')} />
										</div>

										<div className="side right">
											<div id="defaultType" className="select" onClick={onType}>
												<div className="item">
													<div className="name">{type?.name || translate('commonSelect')}</div>
												</div>
												<Icon name="arrow/button" className="arrow black" width={6} height={10} />
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

});

export default PageMainSettingsSpaceIndex;