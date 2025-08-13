import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Select, IconObject, Error, ObjectName, Button, Switch, Editable } from 'Component';
import { I, C, S, U, J, translate, keyboard, analytics, Action } from 'Lib';

interface State {
	error: string;
	cid: string;
	key: string;
	isEditing: boolean;
};

const PageMainSettingsSpaceIndex = observer(class PageMainSettingsSpaceIndex extends React.Component<I.PageSettingsComponent, State> {

	node: any = null;
	refName: any = null;
	refMode = null;
	refUxType = null;
	canSave: boolean = true;

	state = {
		error: '',
		cid: '',
		key: '',
		isEditing: false,
	};

	constructor (props: any) {
		super(props);

		this.setName = this.setName.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onDashboard = this.onDashboard.bind(this);
		this.onType = this.onType.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { error, isEditing } = this.state;
		const { config } = S.Common;
		const space = U.Space.getSpaceview();
		const home = U.Space.getDashboard();
		const type = S.Record.getTypeById(S.Common.type);
		const buttons = this.getButtons();
		const participant = U.Space.getParticipant();
		const canWrite = U.Space.canMyParticipantWrite();
		const isOwner = U.Space.isMyOwner();
		const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
		const widgets = S.Detail.get(S.Block.widgets, S.Block.widgets, [ 'autoWidgetDisabled' ], true);
		const headerButtons = isEditing ? [
			{ color: 'blank', text: translate('commonCancel'), onClick: this.onCancel },
			{ color: 'black', text: translate('commonSave'), onClick: this.onSave, className: 'buttonSave'  },
		] : [
			{ color: 'blank', text: translate('pageSettingsSpaceIndexEdit'), onClick: this.onEdit },
		];
		const cnh = [ 'spaceHeader' ];
		const spaceModes = [
			{ id: I.NotificationMode.All },
			{ id: I.NotificationMode.Mentions },
			{ id: I.NotificationMode.Nothing },
		].map((it: any) => {
			it.name = translate(`notificationMode${it.id}`);
			return it;
		});

		const spaceUxTypes = [
			{ id: I.SpaceUxType.Space, name: translate('commonSpace') },
			{ id: I.SpaceUxType.Chat, name: translate('commonChat') },
		].map((it: any) => {
			it.name = translate(`spaceUxType${it.id}`);
			return it;
		});

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

		return (
			<div ref={node => this.node = node}>
				<div className={cnh.join(' ')}>
					{canWrite ? (
						<div className="buttons">
							{headerButtons.map((el, idx) => <Button className={[ 'c28', el.className ? el.className : ''].join(' ')} key={idx} text={el.text} color={el.color} onClick={el.onClick} />)}
						</div>
					) : ''}

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

					<div className="spaceNameWrapper">
						<Editable
							classNameWrap="spaceName"
							ref={ref => this.refName = ref}
							placeholder={translate('defaultNamePage')}
							readonly={!canWrite || !isEditing}
							onKeyUp={this.onKeyUp}
							maxLength={J.Constant.limit.space.name}
						/>
						<div className="counter" />
					</div>

					{members.length > 1 ? <Label className="membersCounter" text={`${members.length} ${U.Common.plural(members.length, translate('pluralMember'))}`} /> : ''}
				</div>

				<div className="spaceButtons">
					{buttons.map((el, idx) => {
						const cn = [ 'btn' ];

						if (el.isDisabled) {
							cn.push('disabled');
						};

						return (
							<div key={idx} id={U.Common.toCamelCase(`settingsSpaceButton-${el.id}`)} className={cn.join(' ')} onClick={e => this.onClick(e, el)}>
								<Icon className={el.icon} />
								<Label text={el.name} />
							</div>
						);
					})}
				</div>

				<div className="sections">
					<Error text={error} />

					{space.isShared && config.experimental ? (
						<>

							<div className="section sectionSpaceManager">
								<Label className="sub" text={translate(`electronMenuDebug`)} />
								<div className="sectionContent">

									<div className="item">
										<div className="sides">
											<div className="side left">
												<Title text={translate('popupSettingsSpaceIndexUxTypeTitle')} />
											</div>

											<div className="side right">
												<Select
													id="linkStyle"
													ref={ref => this.refUxType = ref}
													value={String(space.uxType)}
													options={spaceUxTypes}
													onChange={v => this.onSpaceUxType(v)}
													arrowClassName="black"
													menuParam={{ horizontal: I.MenuDirection.Right }}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="section sectionSpaceManager">
								<Label className="sub" text={translate(`popupSettingsSpaceIndexCollaborationTitle`)} />
								<div className="sectionContent">

									<div className="item">
										<div className="sides">
											<Icon className={[ 'push', `push${space.notificationMode}` ].join(' ')} />

											<div className="side left">
												<Title text={translate('popupSettingsSpaceIndexPushTitle')} />
												<Label text={translate(`popupSettingsSpaceIndexPushText${space.notificationMode}`)} />
											</div>

											<div className="side right">
												<Select
													id="linkStyle"
													ref={ref => this.refMode = ref}
													value={String(space.notificationMode)}
													options={spaceModes}
													onChange={v => {
														C.PushNotificationSetSpaceMode(S.Common.space, Number(v));
														analytics.event('ChangeMessageNotificationState', { type: v, route: analytics.route.settingsSpaceIndex });
													}}
													arrowClassName="black"
													menuParam={{ horizontal: I.MenuDirection.Right }}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</>
					) : ''}

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
										<Icon className="home" />

										<div className="side left">
											<Title text={translate('commonHomepage')} />
											<Label text={translate('popupSettingsSpaceIndexHomepageDescription')} />
										</div>

										<div className="side right">
											<div id="empty-dashboard-select" className={[ 'select', (space.isChat ? 'isReadonly' : '') ].join(' ')} onClick={this.onDashboard}>
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
										<Icon className="type" />

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
			</div>
		);
	};

	componentDidMount (): void {
		this.setName();
		this.init();
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

		this.refName?.setValue(name);
		this.refName?.placeholderCheck();
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

		this.refMode?.setValue(String(space.notificationMode));
	};

	setInvite (cid: string, key: string) {
		this.setState({ cid, key });
	};

	onKeyUp () {
		const ref = this.refName;

		ref?.placeholderCheck();
		this.updateCounters();
	};

	onDashboard () {
		const space = U.Space.getSpaceview();

		if (!space.isChat) {
			U.Menu.dashboardSelect(`#${this.props.getId()} #empty-dashboard-select`);
		};
	};

	onType (e: any) {
		const { getId } = this.props;

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

	onClick (e: React.MouseEvent, item: any) {
		if (item.isDisabled) {
			return;
		};

		const { cid, key } = this.state;

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

			case 'copyLink': {
				U.Common.copyToast('', U.Space.getInviteLink(cid, key), translate('toastInviteCopy'));
				break;
			};
		};
	};

	onEdit () {
		this.setState({ isEditing: true });
		this.refName?.setFocus();

		this.updateCounters();
	};

	onSave () {
		if (!this.canSave) {
			return;
		};

		C.WorkspaceSetInfo(S.Common.space, {
			name: this.checkName(this.refName?.getTextValue()),
		});
		this.setState({ isEditing: false });
	};

	onCancel () {
		this.setState({ isEditing: false }, this.setName);
	};

	onSpaceUxType (v) {
		v = Number(v);

		const details: any = {
			spaceUxType: v,
			spaceDashboardId: (v == I.SpaceUxType.Chat ? I.HomePredefinedId.Chat : I.HomePredefinedId.Last),
		};

		C.WorkspaceSetInfo(S.Common.space, details);
		analytics.event('ChangeSpaceUxType', { type: v, route: analytics.route.settingsSpaceIndex });
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

	getButtons () {
		const { cid, key } = this.state;

		let buttons: any[] = [
			{ id: 'invite', name: translate('pageSettingsSpaceIndexAddMembers'), icon: 'invite' }
		];

		if (cid && key) {
			buttons = buttons.concat([
				{ id: 'copyLink', name: translate('pageSettingsSpaceIndexCopyLink'), icon: 'copyLink' },
				{ id: 'qr', name: translate('pageSettingsSpaceIndexQRCode'), icon: 'qr' },
			]);
		};

		return buttons;
	};

	updateCounters () {
		const node = $(this.node);
		const { name, nameThreshold } = J.Constant.limit.space;
		const el = node.find('.spaceNameWrapper .counter');
		const counter = name - this.refName?.getTextValue().length;
		const canSave = counter >= 0;

		el.text(counter).toggleClass('show', counter <= nameThreshold);
		el.toggleClass('red', !canSave);

		this.canSave = canSave;
		node.find('.spaceHeader .buttonSave').toggleClass('disabled', !canSave);
	};

});

export default PageMainSettingsSpaceIndex;
