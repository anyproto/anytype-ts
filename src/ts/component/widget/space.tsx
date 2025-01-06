import React, { forwardRef, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, S, U } from 'Lib';

const WidgetSpace = observer(forwardRef<I.WidgetComponent>(() => {

	const space = U.Space.getSpaceview();
	const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
	const requestCnt = participants.filter(it => it.isJoining || it.isRemoving).length;
	const isSpaceOwner = U.Space.isMyOwner();
	const cn = [ 'body' ];

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

	return (
		<div 
			className={cn.join(' ')}
			onClick={onSettings}
		>
			<div className="side left">
				<IconObject 
					id="widget-space-icon" 
					object={{ ...space, layout: I.ObjectLayout.SpaceView }} 
					size={32}
					iconSize={32}
					menuParam={{ className: 'fixed' }}
				/>
				<div className="txt">
					<ObjectName object={space} />
				</div>
			</div>
			<div className="side right">
				<div className="cnt" onClick={onRequest}>{requestCnt}</div>
			</div>
		</div>
	);
}));

export default WidgetSpace;