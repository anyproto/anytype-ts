import React, { useRef, forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName, Label } from 'Component';
import { I, U, S, C, translate, analytics, Action, keyboard } from 'Lib';

const WidgetSpace = observer(forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const spaceview = U.Space.getSpaceview();
	if (!spaceview) {
		return null;
	};

	const nodeRef = useRef(null);
	const canWrite = U.Space.canMyParticipantWrite();
	const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
	const cn = [ U.Data.spaceClass(spaceview.uxType) ];
	const memberLabel = spaceview.isShared ? (
		<Label text={`${members.length} ${U.Common.plural(members.length, translate('pluralMember'))}`} /> 
	) : (
		<Label text={translate('commonPersonalSpace')} />
	);

	const buttons = [
		canWrite ? { 
			id: 'create', 
			name: translate('commonCreate'), 
			withArrow: true,
			arrowTooltipParam: { 
				text: translate('popupShortcutMainBasics19'), 
				caption: keyboard.getCaption('selectType'), 
				typeY: I.MenuDirection.Bottom as any,
			},
		} : null,
		{ id: 'search', name: translate('commonSearch') }
	].filter(it => it);

	const onButtonClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		switch (item.id) {
			case 'member': {
				Action.openSpaceShare(analytics.route.widget);
				analytics.event('ClickSpaceWidgetInvite', { route: analytics.route.widget });
				break;
			};

			case 'search': {
				keyboard.onSearchPopup(analytics.route.widget);
				break;
			};

			case 'create': {
				keyboard.pageCreate({}, analytics.route.widget, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
				break;
			};
		};
	};

	const onArrow = (e: any) => {
		e.stopPropagation();

		U.Menu.typeSuggest({ 
			element: '#button-create-arrow',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetY: 4,
		}, {}, { 
			deleteEmpty: true,
			selectTemplate: true,
			withImport: true,
		}, analytics.route.navigation, object => U.Object.openConfig(object));
	};

	const onMore = () => {
		U.Menu.spaceContext(U.Space.getSpaceview(), {
			element: '#widget-space .nameWrap .arrow',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
		}, { route: analytics.route.widget });
	};

	let content = null;
	if (spaceview.isChat) {
		content = (
			<div className="spaceInfo">
				<IconObject
					id="spaceIcon"
					size={80}
					iconSize={80}
					object={{ ...spaceview, spaceId: S.Common.space }}
				/>
				<div className="nameWrap" onClick={onMore}>
					<ObjectName object={spaceview} />
					<Icon className="arrow" />
				</div>

				{memberLabel}
			</div>
		);
	} else {
		content = (
			<div className="head">
				<IconObject object={spaceview} size={48} />
				<div className="info">
					<div className="nameWrap" onClick={onMore}>
						<ObjectName object={spaceview} />
						<Icon className="arrow" />
					</div>

					{memberLabel}
				</div>
			</div>
		);
	};

	return (
		<div ref={nodeRef} className={cn.join(' ')}>
			{content}
			<div className="buttons">
				{buttons.map((item, idx) => (
					<div className="item" onClick={e => onButtonClick(e, item)} key={idx}>
						<Icon className={item.id} />
						<Label text={item.name} />
						{item.withArrow ? (
							<Icon 
								id={`button-${item.id}-arrow`}
								className="arrow withBackground"
								onClick={onArrow}
								tooltipParam={item.arrowTooltipParam}
							/>
						) : ''}
					</div>
				))}
			</div>
		</div>
	);

}));

export default WidgetSpace;