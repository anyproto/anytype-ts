import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilObject, translate } from 'Lib';
import { commonStore, popupStore } from 'Store';
	
const WidgetSpace = observer(class WidgetSpace extends React.Component<I.WidgetComponent> {

	constructor (props: I.WidgetComponent) {
		super(props);

		this.onOpenSettings = this.onOpenSettings.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
	};

	render (): React.ReactNode {
		const space = UtilObject.getSpace();

		return (
			<div className="body" onClick={this.onOpenSettings}>
				<IconObject 
					id="widget-space-icon" 
					object={{ ...space, layout: I.ObjectLayout.Space }} 
					forceLetter={true} 
					size={36}
					canEdit={true} 
					onSelect={this.onSelect} 
					onUpload={this.onUpload}
					menuParam={{ className: 'fixed' }}
				/>
				<div className="txt">
					<ObjectName object={space} />
					<div className="type">{translate(`spaceType${space.spaceType}`)}</div>
				</div>
			</div>
		);
	};

	onOpenSettings (e: React.MouseEvent) {
		e.stopPropagation();

		popupStore.open('settings', { data: { page: 'spaceIndex', isSpace: true }, className: 'isSpace' });
	};

	onSelect (icon: string) {
		UtilObject.setIcon(commonStore.workspace, icon, '');
	};

	onUpload (hash: string) {
		UtilObject.setIcon(commonStore.workspace, '', hash);
	};

});

export default WidgetSpace;