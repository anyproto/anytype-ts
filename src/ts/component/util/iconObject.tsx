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
	onCheckbox?(e: any): void;
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

const File = {
	other: require('img/icon/file/other.svg'),
	image: require('img/icon/file/image.svg'),
	video: require('img/icon/file/video.svg'),
	text: require('img/icon/file/text.svg'),
	archive: require('img/icon/file/archive.svg'),
	audio: require('img/icon/file/audio.svg'),
	pdf: require('img/icon/file/pdf.svg'),
	presentation: require('img/icon/file/presentation.svg'),
	table: require('img/icon/file/table.svg'),
};

const CheckboxTask0 = require('img/icon/object/checkbox0.svg');
const CheckboxTask1 = require('img/icon/object/checkbox1.svg');

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
		const { id, name, iconEmoji, iconImage, iconClass, done, layout } = object || {};
		const type = DataUtil.schemaField(object.type);
		const cn = [ 'iconObject', type, 'c' + size ];
		const objectType: any = type ? (dbStore.getObjectType(object.type) || {}) : {};
		
		if (className) {
			cn.push(className);
		};
		if (canEdit) {	
			cn.push('canEdit');
		};

		let iconSize = this.iconSize(type, layout, size);
		let icon = null;
		let icn = [];

		switch (type) {
			default:
				switch (layout) {
					default:
					case I.ObjectLayout.Page:
						cn.push('isPage');
						if (iconEmoji || iconImage) {
							icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} hash={iconImage} />;
						};
						break;

					case I.ObjectLayout.Contact:
						cn.push('isUser');
						icn.push('c' + size);
						icon = <IconUser className={icn.join(' ')} {...this.props} name={name} avatar={iconImage} />;
						break;

					case I.ObjectLayout.Task:
						cn.push('isTask');
						icn = icn.concat([ 'iconCheckbox', 'c' + iconSize ]);
						icon = <img src={done ? CheckboxTask1 : CheckboxTask0} className={icn.join(' ')} onClick={this.onCheckbox} />;
						break;
				};
				break;

			case 'image':
				if (id) {
					cn.push('isImage');
					icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
					icon = <img src={commonStore.imageUrl(id, iconSize * 2)} className={icn.join(' ')} />;
				} else {
					cn.push('isFile');
					icn = icn.concat([ 'iconFile', 'c' + iconSize ]);
					icon = <img src={File[Util.fileIcon(object)]} className={icn.join(' ')} />;
				};
				break;

			case 'file':
				cn.push('isFile');
				icn = icn.concat([ 'iconFile', 'c' + iconSize ]);
				icon = <img src={File[Util.fileIcon(object)]} className={icn.join(' ')} />;
				break;
		};

		if (!icon) {
			return null;
		};

		return (
			<div className={cn.join(' ')} onClick={onClick}>{icon}</div>
		);
	};

	iconSize (type: string, layout: I.ObjectLayout, size: number) {
		type = type || 'page';
		let s = Size[size];

		if (size ==  48) {
			switch (type) {
				default:
				case 'page':
					if (layout == I.ObjectLayout.Page) {
						s = 40;
					};
					break;

				case 'set':
				case 'file':
				case 'image':
					s = 40;
					break;

			};
		};
		return s;
	};

	onCheckbox (e: any) {
		const { canEdit, onCheckbox } = this.props;
		if (canEdit && onCheckbox) {
			onCheckbox(e);
		};
	};
	
};

export default IconObject;