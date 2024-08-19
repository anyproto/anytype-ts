import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject } from 'Component';
import { I, S, U, sidebar, translate } from 'Lib';

const WidgetButtons = observer(class WidgetSpace extends React.Component<I.WidgetComponent> {

	render (): React.ReactNode {
		const items = this.getItems();
		const space = U.Space.getSpaceview();
		const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);

		return (
			<div className="body">
				{items.map((item, i) => {
					let members = null;
					let cnt = null;

					if (item.id == 'member') {
						if (space.isShared) {
							members = (
								<div className="members">
									{participants.slice(0, 5).map((item, i) => (
										<IconObject key={item.id} object={item} />
									))}
								</div>
							);

							cnt = <div className="cnt">{participants.length}</div>;
						} else {
							members = <div className="btn">{translate('commonShare')}</div>;
						};
					};

					return (
						<div key={i} className="item" onClick={e => this.onClick(e, item)}>
							<div className="side left">
								<Icon className={item.id} />
								<div className="name">
									{item.name}
									{cnt}
								</div>
							</div>
							<div className="side right">
								{members}
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	getItems () {
		return [
			{ id: 'member', name: 'Members' },
			{ id: 'all', name: 'All content' },
			{ id: 'bin', name: translate('commonBin') },
		];
	};

	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		switch (item.id) {
			case 'member': {
				S.Popup.open('settings', { data: { page: 'spaceShare', isSpace: true }, className: 'isSpace' });
				break;
			};

			case 'all': {
				sidebar.objectContainerShow();
				break;
			};

			case 'bin': {
				U.Object.openEvent(e, { layout: I.ObjectLayout.Archive });
				break;
			};
		};
	};
	
});

export default WidgetButtons;