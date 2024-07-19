import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, C, S, U, translate } from 'Lib';

const WidgetSpace = observer(class WidgetSpace extends React.Component<I.WidgetComponent> {

	node = null;

	constructor (props: I.WidgetComponent) {
		super(props);

		this.onSettings = this.onSettings.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onRequest = this.onRequest.bind(this);
	};

	render (): React.ReactNode {
		const space = U.Space.getSpaceview();

		let content = null;
		if (!space._empty_) {
			content = (
				<React.Fragment>
					<IconObject 
						id="widget-space-icon" 
						object={{ ...space, layout: I.ObjectLayout.SpaceView }} 
						forceLetter={true} 
						size={28}
						iconSize={28}
						onSelect={this.onSelect}
						onUpload={this.onUpload}
						menuParam={{ className: 'fixed' }}
					/>
					<div className="txt">
						<ObjectName object={space} />
					</div>
				</React.Fragment>
			);
		};

		return (
			<div 
				ref={ref => this.node = ref}
				className="body" 
				onClick={this.onSettings}
			>
				<div className="side left">
					{content}
				</div>
				<div className="side right">
					<div id="cnt" className="cnt" onClick={this.onRequest} />
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		this.setCnt();
	};

	componentDidUpdate (): void {
		this.setCnt();
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

	setCnt () {
		const node = $(this.node);
		const cnt = node.find('#cnt');
		const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active, I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]);
		const requestCnt = participants.filter(it => it.isJoining || it.isRemoving).length;
		const isSpaceOwner = U.Space.isMyOwner();
		const showCnt = isSpaceOwner && requestCnt;

		showCnt ? cnt.show() : cnt.hide();
		showCnt ? node.addClass('withCnt') : node.removeClass('withCnt');

		cnt.text(requestCnt);
	};

});

export default WidgetSpace;