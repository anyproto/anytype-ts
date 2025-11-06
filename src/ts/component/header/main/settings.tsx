import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, translate, Relation, analytics, Action, keyboard, sidebar } from 'Lib';
import { Icon, Label } from 'Component';

const HeaderMainSettings = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { menuOpen, isPopup } = props;
	const param = U.Router.getParam(U.Router.getRoute());
	const id = param.id || 'account';
	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const globalName = Relation.getStringValue(participant?.globalName);
	const space = U.Space.getSpaceview();
	const isOwner = U.Space.isMyOwner(space.targetSpaceId);

	const onMore = () => {
		menuOpen('select', '#button-header-more', {
			horizontal: I.MenuDirection.Right,
			data: {
				options: [
					{ id: 'spaceInfo', name: translate('popupSettingsSpaceIndexSpaceInfoTitle') },
					{ id: 'delete', name: isOwner ? translate('pageSettingsSpaceDeleteSpace') : translate('commonLeaveSpace'), color: 'red' },
				],
				onSelect: (e: React.MouseEvent, option: any) => {
					switch (option.id) {
						case 'spaceInfo': {
							Action.spaceInfo();
							break;
						};

						case 'delete': {
							Action.removeSpace(S.Common.space, analytics.route.settings);
							break;
						};
					};
				},
			},
		});
	};

	const renderIdentity = () => {
		if (![ 'account', 'index' ].includes(id) || !globalName) {
			return null;
		};

		return (
			<div id="settings-identity-badge" className="identity">
				<Icon className="anyName" />
				<Label text={globalName} />
			</div>
		);
	};

	const renderMore = () => {
		if (![ 'spaceIndex', 'spaceIndexEmpty' ].includes(id)) {
			return null;
		};

		return (
			<Icon
				id="button-header-more"
				tooltipParam={{ text: translate('commonMenu'), typeY: I.MenuDirection.Bottom }}
				className="more withBackground"
				onClick={onMore}
				onDoubleClick={e => e.stopPropagation()}
			/>
		);
	};

	return (
		<>
			<div className="side left">
				{!isPopup ? (
					<Icon 
						className="widgetPanel withBackground" 
						onClick={() => sidebar.leftPanelSubPageToggle('widget')}
						tooltipParam={{ 
							text: translate('commonWidgets'), 
							caption: keyboard.getCaption('widget'), 
							typeY: I.MenuDirection.Bottom,
						}}
					/>
				) : ''}
			</div>
			<div className="side center">{renderIdentity()}</div>
			<div className="side right">{renderMore()}</div>
		</>
	);

}));

export default HeaderMainSettings;