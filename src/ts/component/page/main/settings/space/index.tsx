import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Input, IconObject, Error, ObjectName, Button, Switch, Editable } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Action } from 'Lib';

interface State {
	error: string;
	cid: string;
	key: string;
	isEditing: boolean;
};

const PageMainSettingsSpaceIndex = observer(class PageMainSettingsSpaceIndex extends React.Component<I.PageSettingsComponent, State> {

	refName: any = null;
	refDescription: any = null;

	state = {
		error: '',
		cid: '',
		key: '',
		isEditing: false,
	};

	constructor (props: any) {
		super(props);

		this.setName = this.setName.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onDashboard = this.onDashboard.bind(this);
		this.onType = this.onType.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { error, isEditing } = this.state;
		const space = U.Space.getSpaceview();
		const home = U.Space.getDashboard();
		const type = S.Record.getTypeById(S.Common.type);
		const buttons = this.getButtons();
		const participant = U.Space.getParticipant();
		const canWrite = U.Space.canMyParticipantWrite();
		const isOwner = U.Space.isMyOwner();
		const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
		const widgets = S.Detail.get(S.Block.widgets, S.Block.widgets, [ 'autoWidgetDisabled' ], true);
		const maxIcons = 5;
		const headerButtons = isEditing ? [
			{ color: 'blank', text: translate('commonCancel'), onClick: this.onCancel },
			{ color: 'black', text: translate('commonSave'), onClick: this.onSave },
		] : [
			{ color: 'blank', text: translate('pageSettingsSpaceIndexEditInfo'), onClick: this.onEdit },
		];
		const cnh = [ 'spaceHeader' ];

		if (isEditing) {
			cnh.push('isEditing');
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

		let membersIcons = null;
		if (canWrite) {
			membersIcons = (
				<div className="membersIcons">
					{members.map((el, idx) => {
						if (idx < maxIcons) {
							return <IconObject key={idx} size={36} object={el} />;
						};
						return null;
					})}
					{members.length > maxIcons ? (
						<div className="membersMore">+{members.length - maxIcons}</div>
					) : ''}
				</div>
			);
		};

		return (
			<>
				<div className={cnh.join(' ')}>
					{canWrite ? (
						<div className="buttons">
							{headerButtons.map((el, idx) => <Button key={idx} text={el.text} className="c28" color={el.color} onClick={el.onClick} />)}
						</div>
					) : ''}

					<Label className="spaceType" text={translate(`spaceAccessType${space.spaceAccessType || 0}`)} />

					<IconObject
						id="spaceIcon"
						size={96}
						iconSize={96}
						object={{ ...space, spaceId: S.Common.space }}
						canEdit={canWrite}
						menuParam={{ horizontal: I.MenuDirection.Center }}
						onSelect={this.onSelect}
						onUpload={this.onUpload}
					/>

					<Input
						ref={ref => this.refName = ref}
						placeholder={translate('defaultNamePage')}
						readonly={!canWrite || !isEditing}
					/>

					{isEditing || this.checkDescription() ? (
						<Editable
							classNameWrap="spaceDescription"
							ref={ref => this.refDescription = ref}
							placeholder={translate('popupSettingsSpaceIndexDescriptionPlaceholder')}
							readonly={!canWrite || !isEditing}
							onKeyUp={() => this.refDescription?.placeholderCheck()}
						/>
					) : ''}
				</div>

				{/*{membersIcons}*/}

				<div className="buttons">
					{buttons.map((el, idx) => {
						const cn = [ 'btn' ];

						if (el.isDisabled) {
							cn.push('disabled');
						};

						return (
							<div key={idx} id={U.Common.toCamelCase(`settingsSpaceButton-${el.id}`)} className={cn.join(' ')} onClick={e => this.onClick(e, el)}>
								<Icon className={el.icon} />
								<Label text={el.name} />
								{el.tooltip ? <Icon className="tooltipOverlay" tooltipParam={{ text: el.tooltip }} /> : ''}
							</div>
						);
					})}
				</div>

				<div className="sections">
					<Error text={error} />

					{canWrite ? (
						<div className="section sectionSpaceManager">
							<Label className="sub" text={translate(`popupSettingsSpaceIndexManageSpaceTitle`)} />
							<div className="sectionContent">

								{isOwner ? (
									<div className="item">
										<div className="sides">
											<Icon className="widget" />

											<div className="side left">
												<Title text={translate('popupSettingsSpaceIndexAutoWidgetsTitle')} />
												<Label text={translate('popupSettingsSpaceIndexAutoWidgetsText')} />
											</div>

											<div className="side right">
												<Switch
													value={!widgets.autoWidgetDisabled}
													className="big"
													onChange={(e: any, v: boolean) => {
														C.ObjectListSetDetails([ S.Block.widgets ], [ { key: 'autoWidgetDisabled', value: !v } ]);

														analytics.event('AutoCreateTypeWidgetToggle', { type: v ? 'true' : 'false' });
													}}
												/>
											</div>
										</div>
									</div>
								) : ''}

								<div className="item">
									<div className="sides">
										<div className="side left">
											<Title text={translate('commonHomepage')} />
											<Label text={translate('popupSettingsSpaceIndexHomepageDescription')} />
										</div>

										<div className="side right">
											<div id="empty-dashboard-select" className="select" onClick={this.onDashboard}>
												<div className="item">
													<div className="name">{home ? home.name : translate('commonSelect')}</div>
												</div>
												<Icon className="arrow black" />
											</div>
										</div>
									</div>
								</div>

								<div className="item">
									<div className="sides">
										<div className="side left">
											<Title text={translate('popupSettingsPersonalDefaultObjectType')} />
											<Label text={translate('popupSettingsPersonalDefaultObjectTypeDescription')} />
										</div>

										<div className="side right">
											<div id="defaultType" className="select" onClick={this.onType}>
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
					) : (
						<div className="membersList section">
							<Label className="sub" text={translate(`pageSettingsSpaceIndexSpaceMembers`)} />
							{members.map((el, idx) => (
								<Member {...el} key={idx} />
							))}
						</div>
					)}
				</div>
			</>
		);
	};

	componentDidMount (): void {
		this.setName();
		this.init();

		analytics.event('ScreenSettingsSpaceIndex');
	};

	componentDidUpdate (): void {
		this.init();
	};

	componentWillUnmount(): void {
		S.Menu.closeAll([ 'select', 'searchObject' ]);
	};

	setName () {
		const space = U.Space.getSpaceview();

		let name = space.name;
		if (name == translate('defaultNamePage')) {
			name = '';
		};
		this.refName.setValue(name);

		if (space.description) {
			this.refDescription?.setValue(space.description);
			this.refDescription?.placeholderCheck();
		};
	};

	init () {
		const { cid, key, isEditing } = this.state;
		const space = U.Space.getSpaceview();
		const win = $(window);

		if (space.isShared && !cid && !key) {
			U.Space.getInvite(S.Common.space, (cid: string, key: string) => {
				if (cid && key) {
					this.setInvite(cid, key);
				};
			});
		};

		win.off('keydown.settingsSpace');

		if (isEditing) {
			win.on('keydown.settingsSpace', (e: any) => {
				keyboard.shortcut('enter', e, () => this.onSave());
				keyboard.shortcut('escape', e, () => this.onCancel());
			});
		};
	};

	setInvite (cid: string, key: string) {
		this.setState({ cid, key });
	};

	onDashboard () {
		U.Menu.dashboardSelect(`#${this.props.getId()} #empty-dashboard-select`);
	};

	onType (e: any) {
		const { getId } = this.props;

		S.Menu.open('typeSuggest', {
			element: `#${getId()} #defaultType`,
			horizontal: I.MenuDirection.Right,
			data: {
				filter: '',
				filters: [
					{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
					{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
				],
				onClick: (item: any) => {
					S.Common.typeSet(item.uniqueKey);
					analytics.event('DefaultTypeChange', { objectType: item.uniqueKey, route: analytics.route.settings });
					this.forceUpdate();
				},
			}
		});
	};

	onSelect (icon: string) {
		if (!icon) {
			C.WorkspaceSetInfo(S.Common.space, { iconImage: '' });
		};
	};

	onUpload (objectId: string) {
		C.WorkspaceSetInfo(S.Common.space, { iconImage: objectId });
	};

	onDelete () {
		Action.removeSpace(S.Common.space, 'Settings', (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
			};
		});
	};

	onClick (e: React.MouseEvent, item: any) {
		if (item.isDisabled) {
			return;
		};

		const { cid, key } = this.state;
		const space = U.Space.getSpaceview();
		const isOwner = U.Space.isMyOwner(space.targetSpaceId);

		switch (item.id) {
			case 'invite': {
				this.props.onPage('spaceShare');

				analytics.event('ClickSettingsSpaceInvite', { route: analytics.route.settingsSpace });
				break;
			};

			case 'qr': {
				S.Popup.open('inviteQr', { data: { link: U.Space.getInviteLink(cid, key) } });
				analytics.event('ScreenQr', { route: analytics.route.settingsSpace });
				break;
			};

			case 'more': {
				const element = `#${U.Common.toCamelCase(`settingsSpaceButton-${item.id}`)}`;
				S.Menu.open('select', {
					element,
					offsetX: 16,
					offsetY: -40,
					onOpen: () => $(element).addClass('hover'),
					onClose: () => $(element).removeClass('hover'),
					data: {
						options: [
							{ id: 'spaceInfo', name: translate('popupSettingsSpaceIndexSpaceInfoTitle') },
							{ id: 'delete', name: isOwner ? translate('pageSettingsSpaceDeleteSpace') : translate('commonLeaveSpace'), color: 'red' },
						],
						onSelect: (e: React.MouseEvent, option: any) => {
							switch (option.id) {
								case 'spaceInfo': {
									this.onSpaceInfo();
									break;
								};
								case 'delete': {
									this.onDelete();
									break;
								};
							};
						},
					}
				});
				break;
			};
		};
	};

	onSpaceInfo () {
		const { account } = S.Auth;
		const space = U.Space.getSpaceview();
		const creator = U.Space.getCreator(space.targetSpaceId, space.creator);
		const data = [
			[ translate(`popupSettingsSpaceIndexSpaceIdTitle`), space.targetSpaceId ],
			[ translate(`popupSettingsSpaceIndexCreatedByTitle`), creator.globalName || creator.identity ],
			[ translate(`popupSettingsSpaceIndexNetworkIdTitle`), account.info.networkId ],
			[ translate(`popupSettingsSpaceIndexCreationDateTitle`), U.Date.dateWithFormat(S.Common.dateFormat, space.createdDate) ],
		];

		S.Popup.open('confirm', {
			className: 'isWide spaceInfo',
			data: {
				title: translate('popupSettingsSpaceIndexSpaceInfoTitle'),
				text: data.map(it => `<dl><dt>${it[0]}:</dt><dd>${it[1]}</dd></dl>`).join(''),
				textConfirm: translate('commonCopy'),
				colorConfirm: 'blank',
				canCancel: false,
				onConfirm: () => {
					U.Common.copyToast(translate('libKeyboardTechInformation'), data.map(it => `${it[0]}: ${it[1]}`).join('\n'));
				},
			}
		});

		analytics.event('ScreenSpaceInfo');
	};

	onEdit () {
		this.setState({ isEditing: true });
		this.refName?.focus();
	};

	onSave () {
		C.WorkspaceSetInfo(S.Common.space, {
			name: this.checkName(this.refName?.getValue()),
			description: this.refDescription?.getTextValue(),
		});
		this.setState({ isEditing: false });
	};

	onCancel () {
		this.setState({ isEditing: false }, this.setName);
	};

	checkName (v: string): string {
		if ([ 
			translate('defaultNameSpace'), 
			translate('defaultNamePage'),
		].includes(v)) {
			v = '';
		};
		return v;
	};

	checkDescription (): boolean {
		return !/^\r?\n$/.test(String(this.refDescription?.getTextValue() || ''));
	};

	getButtons () {
		const { cid, key } = this.state;
		const space = U.Space.getSpaceview();
		const isDisabled = space.spaceAccessType == I.SpaceType.Personal;
		const tooltip = isDisabled ? translate('pageSettingsSpaceIndexEntrySpaceTooltip') : '';

		return [
			{ id: 'invite', name: translate('pageSettingsSpaceIndexInviteMembers'), icon: 'invite', isDisabled, tooltip },
			cid && key ? { id: 'qr', name: translate('pageSettingsSpaceIndexQRCode'), icon: 'qr' } : null,
			{ id: 'more', name: translate('commonMore'), icon: 'more' },
		].filter(it => it);
	};

});

export default PageMainSettingsSpaceIndex;
