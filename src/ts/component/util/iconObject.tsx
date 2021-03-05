import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IconEmoji } from 'ts/component';
import { I, Util, SmileUtil } from 'ts/lib';
import { commonStore } from 'ts/store';

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
	color?: string;
	onSelect?(id: string): void;
	onUpload?(hash: string): void;
	onCheckbox?(e: any): void;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

const IDS40 = [ I.ObjectLayout.Page, I.ObjectLayout.Set, I.ObjectLayout.File, I.ObjectLayout.Image, I.ObjectLayout.ObjectType ];

const Size = {
	16: 16,
	18: 18,
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

const FontSize = {
	16: 10,
	18: 10,
	20: 12,
	24: 13,
	40: 18,
	48: 28,
	56: 34,
	64: 34,
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

const Relation: any = {};
Relation[I.RelationType.LongText] = require('img/icon/dataview/relation/longText.svg');
Relation[I.RelationType.ShortText] = require('img/icon/dataview/relation/shortText.svg');
Relation[I.RelationType.Number] = require('img/icon/dataview/relation/number.svg');
Relation[I.RelationType.Status] = require('img/icon/dataview/relation/status.svg');
Relation[I.RelationType.Date] = require('img/icon/dataview/relation/date.svg');
Relation[I.RelationType.File] = require('img/icon/dataview/relation/file.svg');
Relation[I.RelationType.Checkbox] = require('img/icon/dataview/relation/checkbox.svg');
Relation[I.RelationType.Url] = require('img/icon/dataview/relation/url.svg');
Relation[I.RelationType.Email] = require('img/icon/dataview/relation/email.svg');
Relation[I.RelationType.Phone] = require('img/icon/dataview/relation/phone.svg');
Relation[I.RelationType.Tag] = require('img/icon/dataview/relation/tag.svg');
Relation[I.RelationType.Object] = require('img/icon/dataview/relation/object.svg');

const CheckboxTask0 = require('img/icon/object/checkbox0.svg');
const CheckboxTask1 = require('img/icon/object/checkbox1.svg');

const Lcg = require('font/lcg/medium.otf');
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

class IconObject extends React.Component<Props, {}> {

	public static defaultProps = {
		size: 20,
		tooltipY: I.MenuDirection.Bottom,
		color: 'grey',
	};

	constructor (props: any) {
		super(props);

		this.onCheckbox = this.onCheckbox.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { object, className, size, canEdit, onClick, color } = this.props;
		const layout = Number(object.layout) || I.ObjectLayout.Page;
		const cn = [ 'iconObject', 'c' + size ];
		
		if (className) {
			cn.push(className);
		};
		if (canEdit) {	
			cn.push('canEdit');
		};

		let { id, name, iconEmoji, iconImage, iconClass, done, relationFormat } = object || {};
		let iconSize = this.iconSize(layout, size);
		let icon = null;
		let icn = [];

		switch (layout) {
			default:
			case I.ObjectLayout.Page:
				cn.push('isPage');
				if (iconEmoji || iconImage) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} hash={iconImage} />;
				};
				break;

			case I.ObjectLayout.Human:
				cn.push('isUser');
				icn = icn.concat([ 'iconImage', 'c' + size ]);
				icon = <img src={(iconImage ? commonStore.imageUrl(iconImage, size * 2) : this.userSvg())} className={icn.join(' ')} />;
				break;

			case I.ObjectLayout.Task:
				cn.push('isTask');
				icn = icn.concat([ 'iconCheckbox', 'c' + iconSize ]);
				icon = <img src={done ? CheckboxTask1 : CheckboxTask0} className={icn.join(' ')} onClick={this.onCheckbox} />;
				break;

			case I.ObjectLayout.ObjectType:
				cn.push('isObjectType');

				if (iconEmoji) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} hash={iconImage} />;
				};
				break;

			case I.ObjectLayout.Relation:
				cn.push('isRelation');

				if (Relation[relationFormat]) {
					icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
					icon = <img src={Relation[relationFormat]} className={icn.join(' ')} />;
				};
				break;

			case I.ObjectLayout.Image:
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

			case I.ObjectLayout.File:
				cn.push('isFile');
				icn = icn.concat([ 'iconFile', 'c' + iconSize ]);
				icon = <img src={File[Util.fileIcon(object)]} className={icn.join(' ')} />;
				break;
		};

		if (!icon) {
			return null;
		};

		return (
			<div id={this.props.id} className={cn.join(' ')} onClick={onClick} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
				{icon}
			</div>
		);
	};

	iconSize (layout: I.ObjectLayout, size: number) {
		let s = Size[size];

		if ((size == 48) && (IDS40.indexOf(layout) >= 0)) {
			s = 40;
		};
		return s;
	};

	userSvg (): string {
		const { object, className, size, canEdit, onClick, color } = this.props;
		
		let name = String(object.name || '');
		name = SmileUtil.strip(name);
		name = name.trim().substr(0, 1).toUpperCase();

		const defs = `<defs>
			<style type="text/css">
				@font-face {
					font-family: 'Lcg'; font-style: normal; font-weight: 500;
					src: url('${Lcg}') format('opentype');
				}
			</style>
		</defs>`;

		const circle = `<circle cx="50%" cy="50%" r="50%" fill="${Color[color]}" />`;
		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="Lcg" font-size="${FontSize[size]}px">${name}</text>`;
		const svg = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${size} ${size}" xml:space="preserve" height="${size}px" width="${size}px">${circle}${defs}${text}</svg>`)));
		return svg;
	};

	onCheckbox (e: any) {
		const { canEdit, onCheckbox } = this.props;
		if (canEdit && onCheckbox) {
			onCheckbox(e);
		};
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
		
		Util.tooltipHide();
		
		if (onMouseLeave) {
			onMouseLeave(e);
		};
	};

};

export default IconObject;