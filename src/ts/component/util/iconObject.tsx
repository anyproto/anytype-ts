import * as React from 'react';
import { Icon, IconUser, IconEmoji } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';

interface Props {
	id?: string;
	layout?: I.ObjectLayout;
	object?: any;
	className?: string;
	iconClass?: string;
	canEdit?: boolean;
	native?: boolean;
	asImage?: boolean;
	size?: number;
	offsetX?: number;
	offsetY?: number;
	menuId?: string;
	onSelect?(id: string): void;
	onUpload?(hash: string): void;
	onClick?(e: any): void;
};

class IconObject extends React.Component<Props, {}> {

	public static defaultProps = {
		size: 18,
	};
	
	render () {
		const { object, className, size } = this.props;
		const { id, name, iconEmoji, iconImage } = object || {};
		const type = DataUtil.schemaField(object.type);
		const cn = [ 'iconObject', type ];
		const objectType: any = dbStore.getObjectType(object.type) || {};

		if (className) {
			cn.push(className);
		};

		let icon = null;
		switch (type) {
			default:
				switch (objectType.layout) {
					default:
					case I.ObjectLayout.Page:
						icon = <IconEmoji {...this.props} icon={iconEmoji} hash={iconImage} />;
						break;

					case I.ObjectLayout.Contact:
						icon = <IconUser {...this.props} name={name} avatar={iconImage} />;
						break;

					case I.ObjectLayout.Task:
						break;
				};
				break;

			case 'image':
				if (id) {
					icon = <div className={[ 'iconImage', 'c' + size ].join(' ')} style={{ backgroundImage: 'url("' + commonStore.imageUrl(id, size * 2) + '")' }} />;
				} else {
					icon = <Icon className={[ 'iconFile', Util.fileIcon(object), 'c' + size ].join(' ')} />;
				};
				break;

			case 'file':
				icon = <Icon className={[ 'iconFile', Util.fileIcon(object), 'c' + size ].join(' ')} />;
				break;
		};

		return (
			<div className={cn.join(' ')}>
				{icon}
			</div>
		);
	};
	
};

export default IconObject;