import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, C, S, U, translate } from 'Lib';

const WidgetSpace = observer(class WidgetSpace extends React.Component<I.WidgetComponent> {

	constructor (props: I.WidgetComponent) {
		super(props);

		this.onSettings = this.onSettings.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onRequest = this.onRequest.bind(this);
	};

	render (): React.ReactNode {
		const space = U.Space.getSpaceview();
		const canWrite = U.Space.canMyParticipantWrite();
		const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
		const memberCnt = participants.filter(it => it.isActive).length;
		const requestCnt = participants.filter(it => it.isJoining || it.isRemoving).length;
		const isSpaceOwner = U.Space.isMyOwner();
		const showCnt = isSpaceOwner && requestCnt;

		let status = '';
		if (space && !space._empty_) {
			if (space.isShared) {
				status = U.Common.sprintf('%d %s', memberCnt, U.Common.plural(memberCnt, translate('pluralMember')));
			} else {
				status = translate(`spaceAccessType${space.spaceAccessType}`);
			};
		};

		return (
			<div 
				className={[ 'body', (showCnt ? 'withCnt': '') ].join(' ')} 
				onClick={this.onSettings}
			>
				<div className="side left">
					<IconObject 
						id="widget-space-icon" 
						object={{ ...space, layout: I.ObjectLayout.SpaceView }} 
						forceLetter={true} 
						size={36}
						canEdit={canWrite} 
						onSelect={this.onSelect}
						onUpload={this.onUpload}
						menuParam={{ className: 'fixed' }}
					/>
					<div className="txt">
						<ObjectName object={space} />
						{status ? <div className="type">{status}</div> : ''}
					</div>
				</div>
				<div className="side right">
					{showCnt ? <div className="cnt" onClick={this.onRequest}>{requestCnt}</div> : ''}
				</div>
			</div>
		);
	};

	onSettings (e: React.MouseEvent) {
		e.stopPropagation();
		this.openSettings('spaceIndex');
	};

	onSelect () {
		C.WorkspaceSetInfo(S.Common.space, { iconImage: '' });
	};

	onUpload (objectId: string) {
		C.WorkspaceSetInfo(S.Common.space, { iconImage: objectId });
	};

	onRequest (e: any) {
		e.stopPropagation();
		this.openSettings('spaceShare');
	};

	openSettings (page: string) {
		S.Popup.open('settings', { data: { page, isSpace: true }, className: 'isSpace' });
	};

});

export default WidgetSpace;