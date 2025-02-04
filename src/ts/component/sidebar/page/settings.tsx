import * as React from 'react';
import { observer } from 'mobx-react';
import { S, sidebar, translate, U } from 'Lib';
import { Icon, IconObject, ObjectName } from 'Component';

interface Props extends React.Component {
	page: string;
};

const SidebarSettings = observer(class SidebarSettings extends React.Component<Props, {}> {

	routeBack: any = null;

	render () {
		const space = U.Space.getSpaceview();
		const { membership } = S.Auth;
		const { membershipTiersList } = S.Common;
		const sections = this.getSections();
		const profile = U.Space.getProfile();
		const participant = U.Space.getParticipant() || profile;
		const pathname = U.Router.getRoute();
		const param = U.Router.getParam(pathname);
		const isSpace = this.props.page == 'settingsSpace';

		const onBack = () => {
			if (!this.routeBack || !this.routeBack.pathname) {
				U.Space.openDashboard('route');
				return;
			};

			U.Router.go(this.routeBack.pathname, {});
		};

		const Item = (action: any) => {
			const cn = [ 'item' ];

			let icon = null;
			let name = null;
			let caption = null;

			if (action.id == param.id) {
				cn.push('active');
			};

			if (action.id == 'account') {
				if ('index' == param.id) {
					cn.push('active');
				};

				if (participant) {
					name = participant?.globalName || participant?.name;
					icon = <IconObject object={{ ...participant, name }} size={36} iconSize={36} />;
				};

				cn.push('itemAccount');
			} else {
				icon = <Icon className={`settings-${action.icon || action.id}`} />;
				name = action.name;
			};

			if (action.id == 'membership') {
				if (!membership.isNone) {
					const tierItem = U.Data.getMembershipTier(membership.tier);
					caption = <div className="caption">{tierItem.name}</div>;
				} else {
					caption = <div className="caption join">{translate(`commonJoin`)}</div>;
				};
			};

			return (
				<div
					id={`item-${action.id}`}
					className={cn.join(' ')}
					onClick={() => this.onPage(action.id)}
				>
					{icon}
					<div className="name">{name}</div>

					{caption}
				</div>
			);
		};

		const Section = (item: any) => (
			<div className={[ 'section', String(item.id || '') ].join(' ')}>
				{item.name ? <div className="name">{item.name}</div> : ''}

				<div className="items">
					{item.children.map((action: any, i: number) => (
						<Item key={i} {...action} />
					))}
				</div>
			</div>
		);

		return (
			<div id="containerSettings">
				<div className="head" />

				<div className="body">
					<div className="list">
						{isSpace ? (
							<div className="head" onClick={onBack}>
								<Icon className="back" />
								<ObjectName object={space} />
							</div>
						) : ''}
						<div className="inner">
							{sections.map((item: any, i: number) => (
								<Section key={i} {...item} />
							))}
						</div>
					</div>

					{!isSpace ? (
						<div className="logout" onClick={() => S.Popup.open('logout', {})}>
							<Icon />
							{translate('commonLogout')}
						</div>
					) : ''}
				</div>
			</div>
		);
	};

	componentDidMount () {
		const history = U.Router.history;

		this.routeBack = history.entries[history.index - 1];
	};

	getSections () {
		const isSpace = this.props.page == 'settingsSpace';
		const settingsVault = [
			{ id: 'spaceList', name: translate('popupSettingsSpacesListTitle'), icon: 'spaces' },
			{ id: 'dataIndex', name: translate('popupSettingsDataManagementTitle'), icon: 'storage', subPages: [ 'dataPublish', 'delete' ] },
			{ id: 'phrase', name: translate('popupSettingsPhraseTitle') },
		];

		if (this.withMembership()) {
			settingsVault.push({ id: 'membership', icon: 'membership', name: translate('popupSettingsMembershipTitle1') });
		};

		const appSettings = [
			{ id: 'account', children: [ { id: 'account', name: translate('popupSettingsProfileTitle') } ] },
			{
				name: translate('popupSettingsApplicationTitle'), children: [
					{ id: 'personal', name: translate('popupSettingsPersonalTitle') },
					{ id: 'language', name: translate('pageSettingsLanguageTitle') },
					{ id: 'pinIndex', name: translate('popupSettingsPinTitle'), icon: 'pin', subPages: [ 'pinSelect', 'pinConfirm' ] },
				]
			},
			{ name: translate('popupSettingsAccountAndKeyTitle'), children: settingsVault }
		];
		const spaceSettings = [
			{ name: translate('commonPreferences'), children: [
					{ id: 'spaceIndex', icon: 'space', name: translate('pageSettingsSpaceOverview') },
					{ id: 'spaceMembers', icon: 'members', name: translate('commonMembers') },
					{ id: 'spaceStorageManager', icon: 'storage', name: translate('pageSettingsSpaceRemoteStorage') },
				]
			},
			{ name: translate('pageSettingsSpaceIntegrations'), children: [
					{ id: 'importIndex', icon: 'import', name: translate('commonImport') },
					{ id: 'exportIndex', icon: 'export', name: translate('commonExport') },
				]
			},
		];

		return isSpace ? spaceSettings : appSettings;
	};

	withMembership () {
		return S.Common.isOnline && U.Data.isAnytypeNetwork();
	};

	onPage (page) {
		sidebar.settingsOpen(page);
	};

});

export default SidebarSettings
