import React, { forwardRef, useRef, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, translate, sidebar, keyboard, analytics, Preview } from 'Lib';

const WidgetSpace = observer(forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const { parent } = props;
	const space = U.Space.getSpaceview();
	const plusRef = useRef(null);
	const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
	const requestCnt = participants.filter(it => it.isJoining || it.isRemoving).length;
	const isSpaceOwner = U.Space.isMyOwner();
	const canWrite = U.Space.canMyParticipantWrite();
	const cn = [ 'body' ];
	const cmd = keyboard.cmdSymbol();
	const alt = keyboard.altSymbol();
	const buttons = [
		{ id: 'search', name: translate('commonSearch') },
		{ id: 'all', name: translate('commonAllContent') },
		!space.isPersonal ? { id: 'member', name: translate('pageSettingsSpaceIndexInviteMembers') } : null,
	].filter(it => it);

	if (isSpaceOwner && requestCnt) {
		cn.push('withCnt');
	};

	const onSettings = (e: MouseEvent) => {
		e.stopPropagation();
		U.Object.openRoute({ id: 'spaceIndex', layout: I.ObjectLayout.Settings });
	};

	const onCreate = (e: MouseEvent) => {
		e.stopPropagation();
		keyboard.pageCreate({}, analytics.route.navigation, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
	};

	const onArrow = (e: MouseEvent) => {
		e.stopPropagation();

		U.Menu.typeSuggest({ 
			element: `#widget-${parent.id}-arrow`,
			offsetY: 2,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
		}, {}, { 
			deleteEmpty: true,
			selectTemplate: true,
			withImport: true,
		}, analytics.route.widget, object => U.Object.openAuto(object));
	};

	const onButtonClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		switch (item.id) {
			case 'all': {
				sidebar.leftPanelSetState({ page: 'object' });
				break;
			};

			case 'member': {
				U.Object.openRoute({ id: 'spaceShare', layout: I.ObjectLayout.Settings });
				analytics.event('ClickSpaceWidgetInvite', { route: analytics.route.widget });
				break;
			};

			case 'search': {
				keyboard.onSearchPopup(analytics.route.widget);
				break;
			};
		};
	};

	const onPlusHover = (e: MouseEvent) => {
		const t = Preview.tooltipCaption(translate('commonNew'), `${cmd} + N / ${cmd} + ${alt} + N`);

		Preview.tooltipShow({ text: t, element: $(plusRef.current) });
	};

	return (
		<div 
			className={cn.join(' ')}
			onClick={onSettings}
		>
			<div className="sides">
				<div className="side left">
					<IconObject 
						id="widget-space-icon" 
						object={{ ...space, layout: I.ObjectLayout.SpaceView }} 
						size={20}
						iconSize={20}
						menuParam={{ className: 'fixed' }}
					/>
					<div className="txt">
						<ObjectName object={space} />
					</div>
				</div>
				<div className="side right">
					{canWrite ? (
						<div className="plusWrapper" onMouseEnter={onPlusHover} onMouseLeave={() => Preview.tooltipHide()}>
							<Icon ref={plusRef} className="plus withBackground" onClick={onCreate} />
							<Icon id={`widget-${parent.id}-arrow`} className="arrow withBackground" onClick={onArrow} />
						</div>
					) : ''}
				</div>
			</div>

			<div className="buttons">
				{buttons.map((item, i) => {
					let cnt = null;

					if (item.id == 'member') {
						cnt = <div className="cnt">{requestCnt}</div>;
					};

					return (
						<div 
							key={i} 
							id={`item-${item.id}`} 
							className="item" 
							onClick={e => onButtonClick(e, item)}
						>
							<div className="side left">
								<Icon className={item.id} />
								<div className="name">
									{item.name}
								</div>
							</div>
							<div className="side right">
								{cnt}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);

}));

export default WidgetSpace;
