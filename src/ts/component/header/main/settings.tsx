import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, U, translate, Relation, analytics, Action, keyboard, sidebar } from 'Lib';
import { Icon, Label } from 'Component';
import $ from 'jquery';

const HeaderMainSettings = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { isPopup } = props;
	const param = U.Router.getParam(U.Router.getRoute());
	const id = param.id || 'account';
	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const globalName = Relation.getStringValue(participant?.globalName);
	const space = U.Space.getSpaceview();

	const onMore = () => {
		const element = $('#header #button-header-more');

		U.Menu.spaceContext(space, {
			element,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			onOpen: () => element.addClass('active'),
			onClose: () => element.removeClass('active'),
		}, { noPin: true, isSharePage: id == 'spaceShare', route: analytics.route.settings });
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
		if (![ 'spaceIndex', 'spaceIndexEmpty', 'spaceShare' ].includes(id)) {
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
