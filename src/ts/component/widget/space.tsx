import React, { forwardRef, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, translate, sidebar, keyboard, analytics } from 'Lib';

const WidgetSpace = observer(forwardRef<I.WidgetComponent>(() => {

	const space = U.Space.getSpaceview();
	const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
	const members = participants.filter(it => it.isActive);
	const requestCnt = participants.filter(it => it.isJoining || it.isRemoving).length;
	const isSpaceOwner = U.Space.isMyOwner();
	const cn = [ 'body' ];
	const cmd = keyboard.cmdSymbol();
	const alt = keyboard.altSymbol();
	const buttons = [
		{ id: 'all', name: translate('commonAllContent') },
	];

	if (space.isShared) {
		buttons.unshift({ id: 'member', name: translate('commonMembers') });
	};

	if (space.chatId && U.Object.isAllowedChat()) {
		buttons.push({ id: 'chat', name: translate('commonMainChat') });
	};

	if (isSpaceOwner && requestCnt) {
		cn.push('withCnt');
	};

	const openSettings = (page: string) => {
		S.Popup.open('settings', { data: { page, isSpace: true }, className: 'isSpace' });
	};

	const onSettings = (e: MouseEvent) => {
		e.stopPropagation();
		openSettings('spaceIndex');
	};

	const onRequest = (e: MouseEvent) => {
		e.stopPropagation();
		openSettings('spaceShare');
	};

	const onSearch = (e: MouseEvent) => {
		e.stopPropagation();
		keyboard.onSearchPopup(analytics.route.widget);
	};

	const onCreate = (e: MouseEvent) => {
		e.stopPropagation();
		keyboard.pageCreate({}, analytics.route.widget);
	};

	const onGraph = (e: MouseEvent) => {
		e.stopPropagation();
		U.Object.openAuto({ id: keyboard.getRootId(), layout: I.ObjectLayout.Graph });
	};

	const onButtonClick = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		switch (item.id) {
			case 'member': {
				S.Popup.open('settings', { data: { page: 'spaceShare', isSpace: true }, className: 'isSpace' });
				break;
			};

			case 'all': {
				sidebar.objectContainerToggle();
				break;
			};

			case 'chat': {
				U.Object.openAuto({ id: S.Block.workspace, layout: I.ObjectLayout.Chat });
				break;
			};
		};
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
						size={18}
						iconSize={18}
						menuParam={{ className: 'fixed' }}
					/>
					<div className="txt">
						<ObjectName object={space} />
					</div>
				</div>
				<div className="side right">
					<Icon className="search withBackground" onClick={onSearch} tooltip={translate('commonSearch')} tooltipCaption={`${cmd} + S`} />
					<Icon className="plus withBackground" onClick={onCreate} tooltip={translate('commonCreateNewObject')} tooltipCaption={`${cmd} + N`} />
					<Icon className="graph withBackground" onClick={onGraph} tooltip={translate('commonGraph')} tooltipCaption={`${cmd} + ${alt} + O`} />
					<div className="cnt" onClick={onRequest}>{requestCnt}</div>
				</div>
			</div>

			<div className="buttons">
				{buttons.map((item, i) => {
					let cnt = null;

					if (item.id == 'member') {
						cnt = <div className="cnt">{members.length}</div>;
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
									{cnt}
								</div>
							</div>
							<div className="side right" />
						</div>
					);
				})}
			</div>
		</div>
	);
}));

export default WidgetSpace;