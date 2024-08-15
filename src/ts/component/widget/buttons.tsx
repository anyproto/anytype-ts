import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, translate } from 'Lib';

const WidgetButtons = observer(class WidgetSpace extends React.Component<I.WidgetComponent> {

	render (): React.ReactNode {
		const items = this.getItems();

		return (
			<div className="body">
				{items.map((item, i) => {
					let members = null;
					if (item.id === 'member') {
						members = <div className="btn">Share</div>;
					};

					return (
						<div key={i} className="item" onClick={e => this.onClick(e, item)}>
							<div className="side left">
								<Icon className={item.id} />
								<div className="name">{item.name}</div>
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
				S.Common.showObjectSet(true);
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