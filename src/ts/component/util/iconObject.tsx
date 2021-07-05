import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IconEmoji } from 'ts/component';
import { I, Util, SmileUtil, DataUtil } from 'ts/lib';
import { commonStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

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
	iconSize?: number;
	offsetX?: number;
	offsetY?: number;
	menuId?: string;
	tooltip?: string;
	tooltipY?: I.MenuDirection;
	color?: string;
	getObject?(): any;
	onSelect?(id: string): void;
	onUpload?(hash: string): void;
	onClick?(e: any): void;
	onCheckbox?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

const IDS40 = [ 
	I.ObjectLayout.Page, 
	I.ObjectLayout.Set, 
	I.ObjectLayout.File, 
	I.ObjectLayout.Image, 
	I.ObjectLayout.ObjectType,
];

const IconSize = {
	16: 16,
	18: 18,
	20: 18,
	24: 20,
	26: 22,
	28: 22,
	32: 28,
	40: 24,
	48: 24,
	56: 32,
	64: 32,
	96: 64,
	128: 64,
};

const FontSize = {
	16: 10,
	18: 10,
	20: 12,
	24: 13,
	40: 24,
	48: 28,
	56: 34,
	64: 44,
	96: 44,
	128: 72,
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

const Relation: any = { small: {}, big: {} };
Relation.small[I.RelationType.LongText] = require('img/icon/relation/small/longText.svg');
Relation.small[I.RelationType.ShortText] = require('img/icon/relation/small/shortText.svg');
Relation.small[I.RelationType.Number] = require('img/icon/relation/small/number.svg');
Relation.small[I.RelationType.Status] = require('img/icon/relation/small/status.svg');
Relation.small[I.RelationType.Date] = require('img/icon/relation/small/date.svg');
Relation.small[I.RelationType.File] = require('img/icon/relation/small/file.svg');
Relation.small[I.RelationType.Checkbox] = require('img/icon/relation/small/checkbox.svg');
Relation.small[I.RelationType.Url] = require('img/icon/relation/small/url.svg');
Relation.small[I.RelationType.Email] = require('img/icon/relation/small/email.svg');
Relation.small[I.RelationType.Phone] = require('img/icon/relation/small/phone.svg');
Relation.small[I.RelationType.Tag] = require('img/icon/relation/small/tag.svg');
Relation.small[I.RelationType.Object] = require('img/icon/relation/small/object.svg');

Relation.big[I.RelationType.LongText] = require('img/icon/relation/big/longText.svg');
Relation.big[I.RelationType.ShortText] = require('img/icon/relation/big/shortText.svg');
Relation.big[I.RelationType.Number] = require('img/icon/relation/big/number.svg');
Relation.big[I.RelationType.Status] = require('img/icon/relation/big/status.svg');
Relation.big[I.RelationType.Date] = require('img/icon/relation/big/date.svg');
Relation.big[I.RelationType.File] = require('img/icon/relation/big/file.svg');
Relation.big[I.RelationType.Checkbox] = require('img/icon/relation/big/checkbox.svg');
Relation.big[I.RelationType.Url] = require('img/icon/relation/big/url.svg');
Relation.big[I.RelationType.Email] = require('img/icon/relation/big/email.svg');
Relation.big[I.RelationType.Phone] = require('img/icon/relation/big/phone.svg');
Relation.big[I.RelationType.Tag] = require('img/icon/relation/big/tag.svg');
Relation.big[I.RelationType.Object] = require('img/icon/relation/big/object.svg');

const CheckboxTask0 = require('img/icon/object/checkbox0.svg');
const CheckboxTask1 = require('img/icon/object/checkbox1.svg');

const ObjectType = require('img/icon/object/default.svg');

const Color = {
	grey:	 '#dfddd0',
	black:	 '#2c2b27',
	brown:	 '#aca996',
	orange:	 '#ffb522',
	red:	 '#f55522',
	purple:	 '#ab50cc',
	blue:	 '#3e58eb',
	teal:	 '#0fc8ba',
	lime:	 '#5dd400',
	green:	 '#57c600',
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class IconObject extends React.Component<Props, {}> {

	public static defaultProps = {
		size: 20,
		offsetX: 0,
		offsetY: 0,
		tooltipY: I.MenuDirection.Bottom,
		color: 'grey',
	};

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { className, size, canEdit } = this.props;
		const object = this.getObject();
		const layout = Number(object.layout) || I.ObjectLayout.Page;
		const { id, name, iconEmoji, iconImage, iconClass, done, relationFormat } = object || {};
		const cn = [ 'iconObject', 'c' + size, DataUtil.layoutClass(object.id, layout) ];
		
		if (className) {
			cn.push(className);
		};
		if (canEdit) {	
			cn.push('canEdit');
		};

		let iconSize = this.iconSize(layout, size);
		let icon = null;
		let icn = [];

		switch (layout) {
			default:
			case I.ObjectLayout.Page:
				if (iconEmoji || iconImage || iconClass) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} hash={iconImage} />;
				};
				break;

			case I.ObjectLayout.Human:
				icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
				icon = <img src={(iconImage ? commonStore.imageUrl(iconImage, iconSize * 2) : this.userSvg())} className={icn.join(' ')} />;
				break;

			case I.ObjectLayout.Task:
				icn = icn.concat([ 'iconCheckbox', 'c' + iconSize ]);
				icon = <img src={done ? CheckboxTask1 : CheckboxTask0} className={icn.join(' ')} />;
				break;

			case I.ObjectLayout.ObjectType:
				if (iconEmoji) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} hash={iconImage} />;
				} else {
					cn.push('withoutImage');
					icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
					icon = <img src={this.typeSvg()} className={icn.join(' ')} />;
				};
				break;

			case I.ObjectLayout.Set:
				if (iconEmoji || iconImage) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} hash={iconImage} />;
				} else {
					cn.push('withoutImage');
					icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
					icon = <img src={this.typeSvg()} className={icn.join(' ')} />;
				};
				break;

			case I.ObjectLayout.Relation:
				const key = iconSize < 28 ? 'small' : 'big';
				if (Relation[key][relationFormat]) {
					icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
					icon = <img src={Relation[key][relationFormat]} className={icn.join(' ')} />;
				};
				break;

			case I.ObjectLayout.Image:
				if (id) {
					icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
					icon = <img src={commonStore.imageUrl(id, iconSize * 2)} className={icn.join(' ')} />;
				} else {
					icn = icn.concat([ 'iconFile', 'c' + iconSize ]);
					icon = <img src={File[Util.fileIcon(object)]} className={icn.join(' ')} />;
				};
				break;

			case I.ObjectLayout.File:
				icn = icn.concat([ 'iconFile', 'c' + iconSize ]);
				icon = <img src={File[Util.fileIcon(object)]} className={icn.join(' ')} />;
				break;
		};

		if (!icon) {
			return null;
		};

		return (
			<div id={this.props.id} className={cn.join(' ')} onClick={this.onClick} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
				{icon}
			</div>
		);
	};

	getObject () {
		const { getObject } = this.props;
		return getObject ? getObject() : this.props.object;
	};

	onClick (e: any) {
		const { canEdit, onClick, onCheckbox } = this.props;
		const object = this.getObject();
		const layout = Number(object.layout) || I.ObjectLayout.Page;
		const layoutsEmoji = [ I.ObjectLayout.Page, I.ObjectLayout.Set, I.ObjectLayout.ObjectType ];

		if (onClick) {
			onClick(e);
		};

		if (canEdit) {
			e.stopPropagation();

			if (layout == I.ObjectLayout.Task) {
				onCheckbox(e);
			};

			if (layoutsEmoji.indexOf(layout) >= 0) {
				this.onEmoji(e);
			};
		};
	};

	onEmoji (e: any) {
		e.stopPropagation();

		const { id, offsetX, offsetY, onSelect, onUpload } = this.props;
		const object = this.getObject();
		const layout = Number(object.layout) || I.ObjectLayout.Page;
		const noUpload = layout == I.ObjectLayout.ObjectType;

		menuStore.open('smile', { 
			element: '#' + id,
			offsetX: offsetX,
			offsetY: offsetY,
			data: {
				noUpload: noUpload,
				onSelect: (icon: string) => {
					if (onSelect) {
						onSelect(icon);
					};
				},

				onUpload: (hash: string) => {
					if (onUpload) {
						onUpload(hash);
					};
				}
			}
		});
	};

	iconSize (layout: I.ObjectLayout, size: number) {
		const { iconSize } = this.props;

		let s = IconSize[size];

		if ((size == 18) && (layout == I.ObjectLayout.Task)) {
			s = 16;
		};
		if ((size == 48) && (IDS40.indexOf(layout) >= 0)) {
			s = 40;
		};
		if ((size == 48) && (layout == I.ObjectLayout.Relation)) {
			s = 28;
		};

		if (layout == I.ObjectLayout.Human) {
			s = size;
		};

		if (iconSize) {
			s = iconSize;
		};
		return s;
	};

	fontSize (layout: I.ObjectLayout, size: number) {
		let s = FontSize[size];

		if ((size == 64) && ([ I.ObjectLayout.ObjectType, I.ObjectLayout.Set ].indexOf(layout) >= 0)) {
			s = 44;
		};

		return s;
	};

	userSvg (): string {
		const { size, color } = this.props;
		const object = this.getObject();
		const layout = Number(object.layout) || I.ObjectLayout.Page;
		const iconSize = this.iconSize(layout, size);
		const name = this.iconName();

		const circle = `<circle cx="50%" cy="50%" r="50%" fill="${Color[color]}" />`;
		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="Helvetica" font-weight="medium" font-size="${this.fontSize(layout, iconSize)}px">${name}</text>`;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${iconSize} ${iconSize}" xml:space="preserve" height="${iconSize}px" width="${iconSize}px">${circle}${text}</svg>`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	typeSvg (): string {
		const { size } = this.props;
		const object = this.getObject();
		const layout = Number(object.layout) || I.ObjectLayout.Page;
		const iconSize = this.iconSize(layout, size);
		const name = this.iconName();

		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#CBC9BD" font-family="Helvetica" font-weight="medium" font-size="${this.fontSize(layout, iconSize)}px">${name}</text>`;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${iconSize} ${iconSize}" xml:space="preserve" height="${iconSize}px" width="${iconSize}px">${text}</svg>`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	iconName () {
		const object = this.getObject();

		let name = String(object.name || Constant.default.name);
		name = SmileUtil.strip(name);
		name = name.trim().substr(0, 1).toUpperCase();

		return name;
	};

	onMouseEnter (e: any) {
		const { tooltip, tooltipY, onMouseEnter } = this.props;
		const node = $(ReactDOM.findDOMNode(this));

		if (tooltip) {
			Util.tooltipShow(tooltip, node, tooltipY);
		};
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	onMouseLeave (e: any) {
		const { onMouseLeave } = this.props;
		
		Util.tooltipHide(false);
		
		if (onMouseLeave) {
			onMouseLeave(e);
		};
	};

};

export default IconObject;