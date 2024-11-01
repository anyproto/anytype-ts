import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, sidebar, translate } from 'Lib';

const WidgetButtons = observer(class WidgetSpace extends React.Component<I.WidgetComponent> {

	constructor (props: I.WidgetComponent) {
		super(props);

		this.onMore = this.onMore.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render (): React.ReactNode {
		const items = this.getItems();
		const space = U.Space.getSpaceview();
		const participants = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);

		return (
			<div className="body">
				{items.map((item, i) => {
					let button = null;
					let cnt = null;

					if (item.id == 'member') {
						if (space.isShared) {
							cnt = <div className="cnt">{participants.length}</div>;
						} else {
							button = <div className="btn">{translate('commonShare')}</div>;
						};
					};

					if (item.id == 'all') {
						button = <Icon className="more" onClick={this.onMore} />;
					};

					return (
						<div key={i} id={`item-${item.id}`} className="item" onClick={e => this.onClick(e, item)}>
							<div className="side left">
								<Icon className={item.id} />
								<div className="name">
									{item.name}
									{cnt}
								</div>
							</div>
							<div className="side right">
								{button}
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	getItems () {
		const space = U.Space.getSpaceview();
		const ret = [
			{ id: 'all', name: translate('commonAllContent') },
		];

		if (space.isShared) {
			ret.unshift({ id: 'member', name: translate('commonMembers') });
		};

		if (space.chatId) {
			ret.push({ id: 'chat', name: translate('commonMainChat') });
		};

		return ret;
	};

	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const space = U.Space.getSpaceview();

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

	onMore (e: any) {
		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('select', {
			element: '#widget-buttons #item-all .icon.more',
			horizontal: I.MenuDirection.Center,
			data: {
				options: [
					{ id: 'bin', icon: 'bin-black', name: translate('commonBin') },
				],
				onSelect: (e: any, item: any) => {
					if (item.id == 'bin') {
						U.Object.openEvent(e, { layout: I.ObjectLayout.Archive });
					};
				},
			}
		});
	};
	
});

export default WidgetButtons;
