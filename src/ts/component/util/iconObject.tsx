import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconEmoji } from 'Component';
import { I, S, U, J, Preview, translate, Relation } from 'Lib';

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
	tooltipY?: I.MenuDirection.Top | I.MenuDirection.Bottom;
	color?: string;
	noGallery?: boolean;
	noUpload?: boolean;
	noRemove?: boolean;
	noClick?: boolean;
	menuParam?: Partial<I.MenuParam>;
	style?: any;
	getObject?(): any;
	onSelect?(id: string): void;
	onUpload?(objectId: string): void;
	onClick?(e: any): void;
	onCheckbox?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

const LAYOUTS_WITH_EMOJI_GALLERY = [ 
	I.ObjectLayout.Page, 
	I.ObjectLayout.Type,
	I.ObjectLayout.SpaceView,
	I.ObjectLayout.Human,
	I.ObjectLayout.Chat,
].concat(U.Object.getSetLayouts());

const IconSize = {
	14: 14,
	16: 16,
	18: 16,
	20: 18,
	22: 18,
	24: 20,
	26: 22,
	28: 22,
	30: 22,
	32: 22,
	36: 24,
	40: 24,
	42: 24,
	44: 24,
	48: 24,
	56: 32,
	64: 32,
	80: 56,
	96: 56,
	108: 64,
	112: 64,
	128: 64,
	160: 160,
	360: 360,
};

const FontSize = {
	14: 10,
	16: 10,
	18: 11,
	20: 13,
	22: 14,
	24: 16,
	26: 16,
	30: 20,
	32: 20,
	36: 24,
	40: 24,
	42: 24,
	44: 24,
	48: 28,
	56: 40,
	64: 40,
	80: 64,
	96: 64,
};

const DefaultIcons = [ 'page', 'task', 'set', 'chat', 'bookmark', 'type' ];
const Ghost = require('img/icon/ghost.svg').default;

const CheckboxTask = {
	'': {
		0: require('img/icon/object/checkbox0.svg').default,
		1: require('img/icon/object/checkbox1.svg').default,
		2: require('img/icon/object/checkbox2.svg').default,
	},
	dark: {
		0: require('img/icon/object/checkbox0.svg').default,
		1: require('img/theme/dark/icon/object/checkbox1.svg').default,
		2: require('img/icon/object/checkbox2.svg').default,
	},
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
		style: {},
	};

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { className, size, canEdit, style } = this.props;
		const { theme } = S.Common;
		const object = this.getObject();
		const layout = Number(object.layout) || I.ObjectLayout.Page;
		const { id, name, iconEmoji, iconImage, iconOption, iconClass, done, relationFormat, isDeleted } = object || {};
		const cn = [ 'iconObject', 'c' + size, U.Data.layoutClass(object.id, layout) ];
		const iconSize = this.iconSize();
		const tc = S.Common.getThemeClass();

		if (className) {
			cn.push(className);
		};
		if (canEdit) {	
			cn.push('canEdit');
		};

		let icon = null;
		let icn = [];

		const defaultIcon = (type: string) => {
			if (!DefaultIcons.includes(type)) {
				return;
			};

			cn.push('withDefault');
			icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
			icon = <img src={this.defaultIcon(type)} className={icn.join(' ')} />;
		};

		switch (layout) {
			default:
			case I.ObjectLayout.Chat:
			case I.ObjectLayout.Page: {
				if (iconImage) {
					cn.push('withImage');
				};

				let di = 'page';
				switch (layout) {
					case I.ObjectLayout.Chat: di = 'chat'; break;
					case I.ObjectLayout.Collection: 
					case I.ObjectLayout.Set: di = 'set'; break;
				};

				if (iconEmoji || iconImage || iconClass) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} objectId={iconImage} />;
				} else {
					defaultIcon(di);
				};
				break;
			};

			case I.ObjectLayout.Tag: {
				break;
			};

			case I.ObjectLayout.Collection:
			case I.ObjectLayout.Set: {
				if (iconImage) {
					cn.push('withImage');
				};

				if (iconEmoji || iconImage) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} objectId={iconImage} />;
				} else {
					defaultIcon('set');
				};
				break;
			};

			case I.ObjectLayout.Human: 
			case I.ObjectLayout.Participant: {
				icn = icn.concat([ 'iconImage', 'c' + iconSize ]);

				if (iconImage) {
					cn.push('withImage');
					icon = <img src={S.Common.imageUrl(iconImage, iconSize * 2)} className={icn.join(' ')} />;
				} else {
					icon = <img src={this.userSvg()} className={icn.join(' ')} />;
				};
				break;
			};

			case I.ObjectLayout.Task: {
				icn = icn.concat([ 'iconCheckbox', 'c' + iconSize ]);
				icon = <img id="checkbox" src={done ? CheckboxTask[tc][2] : CheckboxTask[tc][0]} className={icn.join(' ')} />;
				break;
			};

			case I.ObjectLayout.Dashboard: {
				break;
			};

			case I.ObjectLayout.Note: {
				defaultIcon('page');
				break;
			};

			case I.ObjectLayout.Type: {
				if (iconEmoji) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} objectId={iconImage} />;
				} else {
					defaultIcon('type');
				};
				break;
			};

			case I.ObjectLayout.Relation: {
				if ([ I.RelationType.Icon, I.RelationType.Relations ].includes(relationFormat)) {
					break;
				};

				const src = require(`img/icon/relation/${Relation.typeName(relationFormat)}.svg`).default;

				icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
				icon = <img src={src} className={icn.join(' ')} />;
				break;
			};

			case I.ObjectLayout.Bookmark: {
				if (iconImage) {
					icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
					icon = <img src={S.Common.imageUrl(iconImage, iconSize * 2)} className={icn.join(' ')} />;
				} else {
					defaultIcon('bookmark');
				};
				break;
			};

			case I.ObjectLayout.Image: {
				if (id) {
					cn.push('withImage');
					icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
					icon = <img src={S.Common.imageUrl(id, iconSize * 2)} className={icn.join(' ')} />;
				} else {
					icn = icn.concat([ 'iconFile', 'c' + iconSize ]);
					icon = <img src={U.File.iconImage(object)} className={icn.join(' ')} />;
				};
				break;
			};

			case I.ObjectLayout.Video:
			case I.ObjectLayout.Audio:
			case I.ObjectLayout.Pdf:
			case I.ObjectLayout.File: {
				icn = icn.concat([ 'iconFile', 'c' + iconSize ]);
				icon = <img src={U.File.iconImage(object)} className={icn.join(' ')} />;
				break;
			};

			case I.ObjectLayout.SpaceView: {
				icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
				cn.push('withImage');

				if (iconImage) {
					icon = <img src={S.Common.imageUrl(iconImage, iconSize * 2)} className={icn.join(' ')} />;
				} else {
					cn.push('withOption');
					icon = <img src={this.spaceSvg(iconOption)} className={icn.join(' ')} />;
				};
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
				style={style}
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
		return (getObject ? getObject() : this.props.object) || {};
	};

	onClick (e: any) {
		if (this.props.noClick) {
			e.stopPropagation();
		};
	};

	onMouseEnter (e: any) {
		const { canEdit, tooltip, tooltipY, onMouseEnter } = this.props;
		const tc = S.Common.getThemeClass();
		const node = $(this.node);
		const object = this.getObject();

		if (tooltip) {
			Preview.tooltipShow({ text: tooltip, element: node, typeY: tooltipY });
		};

		if (canEdit && U.Object.isTaskLayout(object.layout)) {
			node.find('#checkbox').attr({ src: object.done ? CheckboxTask[tc][2] : CheckboxTask[tc][1] });
		};
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	onMouseLeave (e: any) {
		const { canEdit, onMouseLeave } = this.props;
		const tc = S.Common.getThemeClass();
		const node = $(this.node);
		const object = this.getObject();
		
		Preview.tooltipHide(false);

		if (canEdit && U.Object.isTaskLayout(object.layout)) {
			node.find('#checkbox').attr({ src: object.done ? CheckboxTask[tc][2] : CheckboxTask[tc][0] });
		};
		
		if (onMouseLeave) {
			onMouseLeave(e);
		};
	};

	onMouseDown (e: any) {
		const { canEdit, onClick, onCheckbox } = this.props;
		const object = this.getObject();
		const isTask = U.Object.isTaskLayout(object.layout);
		const isEmoji = LAYOUTS_WITH_EMOJI_GALLERY.includes(object.layout);

		if (onClick) {
			onClick(e);
		};

		if (!canEdit) {
			return;
		};

		if (isTask || isEmoji) {
			e.preventDefault();
			e.stopPropagation();
		};

		if (isTask) {
			if (onCheckbox) {
				onCheckbox(e);
			} else {
				U.Object.setDone(object.id, !object.done);
			};
		} else
		if (isEmoji) {
			this.onEmoji(e);
		};

		this.onMouseLeave(e);
	};

	onEmoji (e: any) {
		e.stopPropagation();

		const { id, offsetX, offsetY, onSelect, onUpload, noRemove, menuParam } = this.props;
		const object = this.getObject();
		const noGallery = this.props.noGallery || [ I.ObjectLayout.SpaceView, I.ObjectLayout.Human ].includes(object.layout);
		const noUpload = this.props.noUpload || [ I.ObjectLayout.Type ].includes(object.layout);

		S.Menu.open('smile', { 
			element: `#${id}`,
			offsetX,
			offsetY,
			data: {
				value: (object.iconEmoji || object.iconImage || ''),
				spaceId: object.spaceId,
				noGallery,
				noUpload,
				noRemove,
				onSelect: (icon: string) => {
					if (onSelect) {
						onSelect(icon);
					} else {
						U.Object.setIcon(object.id, icon, '');
					};
				},
				onUpload: (objectId: string) => {
					if (onUpload) {
						onUpload(objectId);
					} else {
						U.Object.setIcon(object.id, '', objectId);
					};
				},
			},
			...menuParam,
		});
	};

	iconSize () {
		const { size, iconSize } = this.props;
		return iconSize || IconSize[size];
	};

	fontSize (size: number) {
		let s = FontSize[size];

		if (size > 96) {
			s = 72;
		};

		return s;
	};

	fontWeight (size: number) {
		return size > 18 ? 600 : 500;
	};

	userSvg (): string {
		const { size } = this.props;
		const color = J.Theme[S.Common.getThemeClass()]?.iconUser;
		
		const circle = `<circle cx="50%" cy="50%" r="50%" fill="${color.bg}" />`;
		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="${color.text}" font-family="Inter, Helvetica" font-weight="${this.fontWeight(size)}" font-size="${this.fontSize(size)}px">${this.iconName()}</text>`;
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${size} ${size}" xml:space="preserve" height="${size}px" width="${size}px">
				${circle}
				${text}
			</svg>
		`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	spaceSvg (option: number): string {
		const { bg, list } = J.Theme.iconSpace;
		const { size } = this.props;
		const bgColor = bg[list[option - 1]];

		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="Inter, Helvetica" font-weight="${this.fontWeight(size)}" font-size="${this.fontSize(size)}px">${this.iconName()}</text>`;
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${size} ${size}" xml:space="preserve" height="${size}px" width="${size}px">
				<rect width="${size}" height="${size}" fill="${bgColor}"/>
				${text}
			</svg>
		`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	iconName () {
		const object = this.getObject();

		let name = String(object.name || translate('defaultNamePage'));
		name = U.Smile.strip(name);
		name = name.trim().substring(0, 1).toUpperCase();
		name = U.Common.htmlSpecialChars(name);

		return name;
	};

	defaultIcon (type: string) {
		return require(`img/icon/default/${type}.svg`).default;
	};

});

export default IconObject;
