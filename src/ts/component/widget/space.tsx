import React, { forwardRef, useRef, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, translate, sidebar, keyboard, analytics, Preview } from 'Lib';

interface Props extends I.WidgetComponent {
	onToggle(e: any): void;
};

const WidgetSpace = observer(forwardRef<{}, Props>((props, ref) => {

	const { parent, onToggle } = props;
	const space = U.Space.getSpaceview();
	const plusRef = useRef(null);
	const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
	const requestCnt = participants.filter(it => it.isJoining || it.isRemoving).length;
	const canWrite = U.Space.canMyParticipantWrite();
	const cmd = keyboard.cmdSymbol();
	const alt = keyboard.altSymbol();
	const buttons = [
		{ id: 'search', name: translate('commonSearch') },
		space.chatId || U.Object.isAllowedChat() ? { id: 'chat', name: translate('commonMainChat') } : null,
		space.isShared ? { id: 'member', name: translate('pageSettingsSpaceIndexInviteMembers') } : null,
		{ id: 'all', name: translate('commonAllContent') },
	].filter(it => it);

	const onSettings = (e: MouseEvent) => {
		e.stopPropagation();
		U.Object.openAuto({ id: 'spaceIndex', layout: I.ObjectLayout.Settings });
	};

	const onSearch = (e: MouseEvent) => {
		e.stopPropagation();
		keyboard.onSearchPopup(analytics.route.widget);
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
			withImport: true,
		}, analytics.route.widget, object => U.Object.openAuto(object));
	};

	const onButtonClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		switch (item.id) {
			case 'member': {
				U.Object.openAuto({ id: 'spaceShare', layout: I.ObjectLayout.Settings });
				break;
			};

			case 'all': {
				sidebar.leftPanelSetState({ page: 'object' });
				break;
			};

			case 'chat': {
				U.Object.openAuto({ id: S.Block.workspace, layout: I.ObjectLayout.Chat });
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
		<>
			<div onClick={onSettings} className="head">
				<div className="side left">
					<div className="clickable">
						<div className="iconWrap collapse">
							<Icon className="collapse" onClick={onToggle} />
						</div>
						<IconObject 
							id="widget-space-icon" 
							object={{ ...space, layout: I.ObjectLayout.SpaceView }} 
							size={20}
							iconSize={18}
							menuParam={{ className: 'fixed' }}
						/>
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

			<div id="contentWrapper" className="contentWrapper">
				<div id="innerWrap">
					{buttons.map((item, i) => {
						const cn = [ 'item' ];

						let cnt = null;
						if ((item.id == 'member') && requestCnt) {
							cnt = <div className="cnt">{requestCnt}</div>;
							cn.push('withCnt');
						};

						return (
							<div 
								key={i} 
								id={`item-${item.id}`} 
								className={cn.join(' ')} 
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
		</>
	);

}));

export default WidgetSpace;
