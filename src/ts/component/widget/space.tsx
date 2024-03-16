import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, C, UtilObject, UtilCommon, translate } from 'Lib';
import { popupStore, commonStore } from 'Store';
	
const WidgetSpace = observer(class WidgetSpace extends React.Component<I.WidgetComponent> {

	constructor (props: I.WidgetComponent) {
		super(props);

		this.onSettings = this.onSettings.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onRequest = this.onRequest.bind(this);
	};

	render (): React.ReactNode {
		const space = UtilObject.getSpaceview();
		const canWrite = UtilObject.canParticipantWrite();
		const members = UtilObject.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining ]);
		const memberCnt = members.filter(it => it.status == I.ParticipantStatus.Active).length;
		const requestCnt = members.filter(it => it.status == I.ParticipantStatus.Joining).length;
		const isSpaceOwner = UtilObject.isSpaceOwner();

		let status = '';
		if (space && !space._empty_) {
			if (space.spaceAccessType == I.SpaceType.Shared) {
				status = UtilCommon.sprintf('%d %s', memberCnt, UtilCommon.plural(memberCnt, translate('pluralMember')));
			} else {
				status = translate(`spaceAccessType${space.spaceAccessType}`);
			};
		};

		return (
			<div className="body" onClick={this.onSettings}>
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
					{isSpaceOwner && requestCnt ? <div className="cnt" onClick={this.onRequest}>{requestCnt}</div> : ''}
				</div>
			</div>
		);
	};

	onSettings (e: React.MouseEvent) {
		e.stopPropagation();

		this.openSettings('spaceIndex');
	};

	onSelect () {
		C.WorkspaceSetInfo(commonStore.space, { iconImage: '' });
	};

	onUpload (objectId: string) {
		C.WorkspaceSetInfo(commonStore.space, { iconImage: objectId });
	};

	onRequest (e: any) {
		e.stopPropagation();

		this.openSettings('spaceShare');
	};

	openSettings (page: string) {
		popupStore.open('settings', { data: { page, isSpace: true }, className: 'isSpace' });
	};

});

export default WidgetSpace;