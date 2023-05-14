import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, ObjectUtil, analytics, translate } from 'Lib';
import { commonStore, detailStore, popupStore } from 'Store';
import Constant from 'json/constant.json';
	
const WidgetSpace = observer(class WidgetSpace extends React.Component<I.WidgetComponent> {

	constructor (props: I.WidgetComponent) {
		super(props);

		this.onOpenSpace = this.onOpenSpace.bind(this);
		this.onOpenSettings = this.onOpenSettings.bind(this);
	};

	render (): React.ReactNode {
		const space = detailStore.get(Constant.subId.space, commonStore.workspace, []);

		return (
			<div className="body">
				<div className="side left" onClick={this.onOpenSpace}>
					<IconObject object={{ ...space, layout: I.ObjectLayout.Space }} forceLetter={true} size={48} />
					<div className="txt">
						<ObjectName object={space} />
						<div className="type">{translate(`spaceType${space.spaceType}`)}</div>
					</div>
				</div>

				<div className="side right">
					<Icon className="settings" tooltip="Settings" onClick={this.onOpenSettings} />
				</div>
			</div>
		);
	};

	onOpenSpace () {
		ObjectUtil.openRoute({ layout: I.ObjectLayout.Graph });
	};

	onOpenSettings (e: React.MouseEvent) {
		e.stopPropagation();

		popupStore.open('settings', { data: { page: 'spaceIndex', isSpace: true } });
	};

});

export default WidgetSpace;