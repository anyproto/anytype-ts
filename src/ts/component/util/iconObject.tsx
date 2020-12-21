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

const Size = {
	20: 18,
	24: 20,
	26: 20,
	28: 22,
	32: 28,
	40: 24,
	48: 24,
	64: 32,
	96: 96,
};

class IconObject extends React.Component<Props, {}> {

	public static defaultProps = {
		size: 20,
	};
	
	render () {
		const { object, className, size } = this.props;
		const { id, name, iconEmoji, iconImage, iconClass } = object || {};
		const type = DataUtil.schemaField(object.type);
		const cn = [ 'iconObject', type, 'c' + size ];
		const objectType: any = type ? (dbStore.getObjectType(object.type) || {}) : {};
		const iconSize = Size[size];

		if (className) {
			cn.push(className);
		};

		let icon = null;
		switch (type) {
			default:
				switch (objectType.layout) {
					default:
					case I.ObjectLayout.Page:
						icon = <IconEmoji {...this.props} className={'c' + size} iconClass={iconClass} size={iconSize} icon={iconEmoji} hash={iconImage} />;
						break;

					case I.ObjectLayout.Contact:
						icon = <IconUser className={'c' + size} {...this.props} name={name} avatar={iconImage} />;
						break;

					case I.ObjectLayout.Task:
						break;
				};
				break;

			case 'image':
				if (id) {
					icon = <img src={commonStore.imageUrl(id, iconSize * 2)} className={[ 'iconImage', 'c' + iconSize ].join(' ')} />;
				} else {
					icon = <div className={[ 'iconFile', Util.fileIcon(object), 'c' + iconSize ].join(' ')} />;
				};
				break;

			case 'file':
				icon = <div className={[ 'iconFile', Util.fileIcon(object), 'c' + iconSize ].join(' ')} />;
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