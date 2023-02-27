import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { IconEmoji } from 'Component';
import { I, Preview, SmileUtil, DataUtil, FileUtil } from 'Lib';
import { commonStore, menuStore } from 'Store';

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
	forceLetter?: boolean;
	noRemove?: boolean;
	noClick?: boolean;
	menuParam?: Partial<I.MenuParam>;
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
	I.ObjectLayout.Type,
	I.ObjectLayout.Space,
];

const LAYOUT_EMOJI = [ 
	I.ObjectLayout.Page, 
	I.ObjectLayout.Set, 
	I.ObjectLayout.Space, 
	I.ObjectLayout.Type,
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
	80: 64,
	96: 64,
	128: 64,
};

const FontSize = {
	16: 10,
	18: 10,
	20: 12,
	24: 14,
	26: 16,
	32: 18,	
	40: 24,
	48: 28,
	56: 34,
	64: 44,
	80: 48,
	96: 66,
	128: 72,
};

const File = {
	other: require('img/icon/file/other.svg').default,
	image: require('img/icon/file/image.svg').default,
	video: require('img/icon/file/video.svg').default,
	text: require('img/icon/file/text.svg').default,
	archive: require('img/icon/file/archive.svg').default,
	audio: require('img/icon/file/audio.svg').default,
	pdf: require('img/icon/file/pdf.svg').default,
	presentation: require('img/icon/file/presentation.svg').default,
	table: require('img/icon/file/table.svg').default,
};

const Relation: any = { small: {}, big: {} };
Relation.small[I.RelationType.LongText] = require('img/icon/relation/small/longText.svg').default;
Relation.small[I.RelationType.ShortText] = require('img/icon/relation/small/shortText.svg').default;
Relation.small[I.RelationType.Number] = require('img/icon/relation/small/number.svg').default;
Relation.small[I.RelationType.Status] = require('img/icon/relation/small/status.svg').default;
Relation.small[I.RelationType.Date] = require('img/icon/relation/small/date.svg').default;
Relation.small[I.RelationType.File] = require('img/icon/relation/small/file.svg').default;
Relation.small[I.RelationType.Checkbox] = require('img/icon/relation/small/checkbox.svg').default;
Relation.small[I.RelationType.Url] = require('img/icon/relation/small/url.svg').default;
Relation.small[I.RelationType.Email] = require('img/icon/relation/small/email.svg').default;
Relation.small[I.RelationType.Phone] = require('img/icon/relation/small/phone.svg').default;
Relation.small[I.RelationType.Tag] = require('img/icon/relation/small/tag.svg').default;
Relation.small[I.RelationType.Object] = require('img/icon/relation/small/object.svg').default;

Relation.big[I.RelationType.LongText] = require('img/icon/relation/big/longText.svg').default;
Relation.big[I.RelationType.ShortText] = require('img/icon/relation/big/shortText.svg').default;
Relation.big[I.RelationType.Number] = require('img/icon/relation/big/number.svg').default;
Relation.big[I.RelationType.Status] = require('img/icon/relation/big/status.svg').default;
Relation.big[I.RelationType.Date] = require('img/icon/relation/big/date.svg').default;
Relation.big[I.RelationType.File] = require('img/icon/relation/big/file.svg').default;
Relation.big[I.RelationType.Checkbox] = require('img/icon/relation/big/checkbox.svg').default;
Relation.big[I.RelationType.Url] = require('img/icon/relation/big/url.svg').default;
Relation.big[I.RelationType.Email] = require('img/icon/relation/big/email.svg').default;
Relation.big[I.RelationType.Phone] = require('img/icon/relation/big/phone.svg').default;
Relation.big[I.RelationType.Tag] = require('img/icon/relation/big/tag.svg').default;
Relation.big[I.RelationType.Object] = require('img/icon/relation/big/object.svg').default;

const Home = require('img/icon/home.svg').default;
const CheckboxTask0 = require('img/icon/object/checkbox0.svg').default;
const CheckboxTask1 = require('img/icon/object/checkbox1.svg').default;
const Ghost = require('img/icon/ghost.svg').default;

const BgColor = {
	grey:	 '#f3f2ec',
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

const Color = {
	'':		 '#aca996',
	dark:	 '#dfddd3'
};

const Theme = {
	dark: {
		grey: '#484843',
	}
};


const IconObject = observer(class IconObject extends React.Component<Props> {

	node: any = null;
	public static defaultProps = {
		size: 20,
		offsetX: 0,
		offsetY: 0,
		tooltipY: I.MenuDirection.Bottom,
		color: 'grey',
		menuParam: {},
	};

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { className, size, canEdit, forceLetter } = this.props;
		const { theme } = commonStore;
		const object = this.getObject();
		const layout = Number(object.layout) || I.ObjectLayout.Page;
		const { id, name, iconEmoji, iconImage, iconClass, done, relationFormat, isDeleted } = object || {};
		const cn = [ 'iconObject', 'c' + size, DataUtil.layoutClass(object.id, layout) ];
		const iconSize = this.iconSize();
		
		if (className) {
			cn.push(className);
		};
		if (canEdit) {	
			cn.push('canEdit');
		};

		let icon = null;
		let icn = [];
		let onLetter = () => {
			cn.push('withLetter');
			icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
			icon = <img src={this.commonSvg()} className={icn.join(' ')} />;
		};

		switch (layout) {
			default:
			case I.ObjectLayout.Page: {
				if (iconImage) {
					cn.push('withImage');
				};

				if (iconEmoji || iconImage || iconClass) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} hash={iconImage} />;
				} else 
				if (forceLetter) {
					onLetter();
				};
				break;
			};

			case I.ObjectLayout.Human: {
				if (iconImage) {
					cn.push('withImage');
				};
				
				icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
				icon = <img src={(iconImage ? commonStore.imageUrl(iconImage, iconSize * 2) : this.userSvg())} className={icn.join(' ')} />;
				break;
			};

			case I.ObjectLayout.Task: {
				icn = icn.concat([ 'iconCheckbox', 'c' + iconSize ]);
				icon = <img src={done ? CheckboxTask1 : CheckboxTask0} className={icn.join(' ')} />;
				break;
			};

			case I.ObjectLayout.Note: {
				break;
			};

			case I.ObjectLayout.Type: {
				if (iconEmoji) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} hash={iconImage} />;
				} else 
				if (forceLetter) {
					onLetter();
				};
				break;
			};

			case I.ObjectLayout.Set: {
				if (iconImage) {
					cn.push('withImage');
				};

				if (iconEmoji || iconImage) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} hash={iconImage} />;
				} else 
				if (forceLetter) {
					onLetter();
				};
				break;
			};

			case I.ObjectLayout.Relation: {
				const key = iconSize < 28 ? 'small' : 'big';
				if (Relation[key][relationFormat]) {
					icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
					icon = <img src={Relation[key][relationFormat]} className={icn.join(' ')} />;
				};
				break;
			};

			case I.ObjectLayout.Image: {
				if (id) {
					cn.push('withImage');
					icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
					icon = <img src={commonStore.imageUrl(id, iconSize * 2)} className={icn.join(' ')} />;
				} else {
					icn = icn.concat([ 'iconFile', 'c' + iconSize ]);
					icon = <img src={File[FileUtil.icon(object)]} className={icn.join(' ')} />;
				};
				break;
			};

			case I.ObjectLayout.Bookmark: {
				if (iconImage) {
					icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
					icon = <img src={commonStore.imageUrl(iconImage, iconSize * 2)} className={icn.join(' ')} />;
				};
				break;
			};

			case I.ObjectLayout.File: {
				icn = icn.concat([ 'iconFile', 'c' + iconSize ]);
				icon = <img src={File[FileUtil.icon(object)]} className={icn.join(' ')} />;
				break;
			};

			case I.ObjectLayout.Dashboard: {
				icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
				icon = <img src={Home} className={icn.join(' ')} />;
				break;
			};
		};

		if (isDeleted) {
			icn = [ 'iconCommon', 'c' + iconSize ];
			icon = <img src={Ghost} className={icn.join(' ')} />;
		};

		if (!icon) {
			return null;
		};

		return (
			<div 
				ref={node => this.node = node}
				id={this.props.id} 
				className={cn.join(' ')} 
				onClick={this.onClick}
				onMouseDown={this.onMouseDown} 
				onMouseEnter={this.onMouseEnter} 
				onMouseLeave={this.onMouseLeave}
				draggable={true}
				onDragStart={(e: any) => { 
					e.preventDefault(); 
					e.stopPropagation(); 
				}}
			>
				{icon}
			</div>
		);
	};

	getObject () {
		const { getObject } = this.props;
		return getObject ? getObject() : this.props.object;
	};

	onClick (e: any) {
		if (this.props.noClick) {
			e.stopPropagation();
		};
	};

	onMouseDown (e: any) {
		const { canEdit, onClick, onCheckbox } = this.props;
		const object = this.getObject();
		const { layout } = object;

		if (onClick) {
			onClick(e);
		};

		if (!canEdit) {
			return;
		};

		if (layout == I.ObjectLayout.Task) {
			e.stopPropagation();
			onCheckbox(e);
		};

		if (LAYOUT_EMOJI.includes(layout)) {
			e.stopPropagation();
			this.onEmoji(e);
		};
	};

	onEmoji (e: any) {
		e.stopPropagation();

		const { id, offsetX, offsetY, onSelect, onUpload, noRemove, menuParam } = this.props;
		const object = this.getObject();
		const { iconEmoji, iconImage, layout } = object;
		const noUpload = layout == I.ObjectLayout.Type;

		menuStore.open('smile', { 
			element: `#${id}`,
			offsetX,
			offsetY,
			data: {
				noUpload,
				noRemove: noRemove || !(iconEmoji || iconImage),
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
			},
			...menuParam,
		});
	};

	iconSize () {
		const { size, iconSize, forceLetter } = this.props;
		const object = this.getObject();
		const { layout, iconImage, iconEmoji, isDeleted } = object;

		let s = IconSize[size];

		if (isDeleted) {
			return s;
		};

		if ((size == 18) && (layout == I.ObjectLayout.Task)) {
			s = 16;
		};
		if ((size == 48) && (IDS40.indexOf(layout) >= 0)) {
			s = 40;
		};
		if ((size == 48) && (layout == I.ObjectLayout.Relation)) {
			s = 28;
		};

		if ((layout == I.ObjectLayout.Human) && (size >= 40)) {
			s = size;
		};

		if ((layout == I.ObjectLayout.Set) && iconImage) {
			s = size;
		};

		if (([ I.ObjectLayout.Set, I.ObjectLayout.Type ].indexOf(layout) >= 0) && !iconImage && !iconEmoji && (size >= 40)) {
			s = size;
		};

		if (([ I.ObjectLayout.Task, I.ObjectLayout.Relation ].indexOf(layout) < 0) && forceLetter && !iconImage && !iconEmoji && (size >= 40)) {
			s = size;
		};

		if (iconSize) {
			s = iconSize;
		};
		return s;
	};

	fontSize (layout: I.ObjectLayout, size: number) {
		let s = FontSize[size];

		if ((size == 64) && ([ I.ObjectLayout.Type, I.ObjectLayout.Set ].indexOf(layout) >= 0)) {
			s = 44;
		};

		return s;
	};

	svgBgColor () {
		const { color } = this.props;
		const theme = commonStore.getThemeClass();

		if (Theme[theme] && Theme[theme][color]) {
			return Theme[theme][color];
		};
		return BgColor[color];
	};

	svgColor () {
		return Color[commonStore.getThemeClass()];
	};

	userSvg (): string {
		const object = this.getObject();
		const { layout } = object;
		const iconSize = this.iconSize();
		const name = this.iconName();
		
		const circle = `<circle cx="50%" cy="50%" r="50%" fill="${this.svgBgColor()}" />`;
		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="${this.svgColor()}" font-family="Helvetica" font-weight="medium" font-size="${this.fontSize(layout, iconSize)}px">${name}</text>`;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${iconSize} ${iconSize}" xml:space="preserve" height="${iconSize}px" width="${iconSize}px">${circle}${text}</svg>`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	commonSvg (): string {
		const object = this.getObject();
		const { layout } = object;
		const iconSize = this.iconSize();
		const name = this.iconName();

		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="${this.svgColor()}" font-family="Helvetica" font-weight="medium" font-size="${this.fontSize(layout, iconSize)}px">${name}</text>`;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${iconSize} ${iconSize}" xml:space="preserve" height="${iconSize}px" width="${iconSize}px">${text}</svg>`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	iconName () {
		const object = this.getObject();

		let name = String(object.name || DataUtil.defaultName('page'));
		name = SmileUtil.strip(name);
		name = name.trim().substr(0, 1).toUpperCase();

		return name;
	};

	onMouseEnter (e: any) {
		const { tooltip, tooltipY, onMouseEnter } = this.props;
		const node = $(this.node);

		if (tooltip) {
			Preview.tooltipShow(tooltip, node, I.MenuDirection.Center, tooltipY);
		};
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	onMouseLeave (e: any) {
		const { onMouseLeave } = this.props;
		
		Preview.tooltipHide(false);
		
		if (onMouseLeave) {
			onMouseLeave(e);
		};
	};

});

export default IconObject;