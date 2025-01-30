import * as React from 'react';
import { observer } from 'mobx-react';
import { S, sidebar, translate, U } from 'Lib';
import { Icon, IconObject } from 'Component';

const SidebarSettings = observer(class SidebarSettings extends React.Component<{}, {}> {

	render() {
		const space = U.Space.getSpaceview();
		const { membership } = S.Auth;
		const { membershipTiersList } = S.Common;
		const sections = this.getSections();
		const profile = U.Space.getProfile();
		const participant = U.Space.getParticipant() || profile;
		const pathname = U.Router.getRoute();
		const param = U.Router.getParam(pathname);

		const Item = (action: any) => {
			const cn = [ 'item' ];

			let icon = null;
			let name = null;
			let caption = null;

			if (action.id == param.id) {
				cn.push('active');
			};

			if (action.id == 'spaceIndex') {
				if (participant) {
					name = space?.name;
					icon = <IconObject object={{ ...space, spaceId: S.Common.space, name }} size={36} iconSize={36} />;
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
						{sections.map((item: any, i: number) => (
							<Section key={i} {...item} />
						))}
					</div>

					<div className="logout" onClick={() => S.Popup.open('logout', {})}>
						<Icon />
						{translate('commonLogout')}
					</div>
				</div>
			</div>
		);
	};

	getSections () {
		const settingsVault = [
			{ id: 'spaceList', name: translate('popupSettingsSpacesListTitle'), icon: 'spaces' },
			{ id: 'dataIndex', name: translate('popupSettingsDataManagementTitle'), icon: 'storage', subPages: [ 'dataPublish', 'delete' ] },
			{ id: 'phrase', name: translate('popupSettingsPhraseTitle') },
		];

		if (this.withMembership()) {
			settingsVault.push({ id: 'membership', icon: 'membership', name: translate('popupSettingsMembershipTitle1') });
		};

		return [
			{ id: 'space', children: [ { id: 'spaceIndex', name: translate('popupSettingsSpaceTitle') } ] },
			{
				id: 'index', name: translate('popupSettingsApplicationTitle'), children: [
					{ id: 'account', name: translate('popupSettingsProfileTitle') },
					{ id: 'personal', name: translate('popupSettingsPersonalTitle') },
					{ id: 'appearance', name: translate('popupSettingsColorMode') },
					{ id: 'pinIndex', name: translate('popupSettingsPinTitle'), icon: 'pin', subPages: [ 'pinSelect', 'pinConfirm' ] },
				]
			},
			{ id: 'test',  name: translate('popupSettingsAccountAndKeyTitle'), children: settingsVault }
		];
	};

	withMembership () {
		return S.Common.isOnline && U.Data.isAnytypeNetwork();
	};

	onPage (page) {
		sidebar.settingsOpen(page);
	};
});

export default SidebarSettings
