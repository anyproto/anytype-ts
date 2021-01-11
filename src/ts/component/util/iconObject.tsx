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
	tooltip?: string;
	tooltipY?: I.MenuDirection;
	onSelect?(id: string): void;
	onUpload?(hash: string): void;
	onCheckbox?(): void;
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
	96: 64,
	128: 64,
};

class IconObject extends React.Component<Props, {}> {

	public static defaultProps = {
		size: 20,
	};

	constructor (props: any) {
		super(props);

		this.onCheckbox = this.onCheckbox.bind(this);
	};
	
	render () {
		const { object, className, size, canEdit, onClick } = this.props;
		const { id, name, iconEmoji, iconImage, iconClass } = object || {};
		const type = DataUtil.schemaField(object.type);
		const cn = [ 'iconObject', type, 'c' + size ];
		const icn = [];
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
						cn.push('isPage');
						icon = <IconEmoji {...this.props} className={'c' + size} iconClass={iconClass} size={iconSize} icon={iconEmoji} hash={iconImage} />;
						break;

					case I.ObjectLayout.Contact:
						cn.push('isUser');
						icon = <IconUser className={'c' + size} {...this.props} name={name} avatar={iconImage} />;
						break;

					case I.ObjectLayout.Task:
						icn.push('iconCheckbox');
						if (object.done) {	
							icn.push('isActive');
						};
						if (canEdit) {	
							icn.push('canEdit');
						};
						icon = <div className={icn.join(' ')} onClick={this.onCheckbox} />
						break;
				};
				break;

			case 'image':
				if (id) {
					cn.push('isImage');
					icon = <img src={commonStore.imageUrl(id, iconSize * 2)} className={[ 'iconImage', 'c' + iconSize ].join(' ')} />;
				} else {
					cn.push('isFile');
					icon = <div className={[ 'iconFile', Util.fileIcon(object), 'c' + iconSize ].join(' ')} />;
				};
				break;

			case 'file':
				cn.push('isFile');
				icon = <div className={[ 'iconFile', Util.fileIcon(object), 'c' + iconSize ].join(' ')} />;
				break;
		};

		return (
			<div className={cn.join(' ')} onClick={onClick}>{icon}</div>
		);
	};

	onCheckbox (e: any) {
		const { canEdit, onCheckbox } = this.props;
		if (canEdit && onCheckbox) {
			onCheckbox();
		};
	};
	
};

export default IconObject;