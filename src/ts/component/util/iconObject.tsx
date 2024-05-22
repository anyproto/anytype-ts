import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconEmoji } from 'Component';
import { I, Preview, UtilSmile, UtilData, UtilFile, UtilObject, UtilCommon, translate } from 'Lib';
import { commonStore, menuStore } from 'Store';
const Colors = require('json/colors.json');
const Theme = require('json/theme.json');

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
	forceLetter?: boolean;
	noGallery?: boolean;
	noUpload?: boolean;
	noRemove?: boolean;
	noClick?: boolean;
	menuParam?: Partial<I.MenuParam>;
	getObject?(): any;
	onSelect?(id: string): void;
	onUpload?(objectId: string): void;
	onClick?(e: any): void;
	onCheckbox?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

const LAYOUT_EMOJI = [ 
	I.ObjectLayout.Page, 
	I.ObjectLayout.Type,
	I.ObjectLayout.SpaceView,
].concat(UtilObject.getSetLayouts());

const IconSize = {
	14: 14,
	16: 16,
	18: 16,
	20: 18,
	22: 18,
	24: 20,
	26: 22,
	28: 22,
	32: 28,
	36: 24,
	40: 24,
	44: 24,
	48: 24,
	56: 32,
	64: 32,
	80: 56,
	96: 56,
	108: 64,
	112: 64,
	128: 64,
};

const FontSize = {
	14: 10,
	16: 10,
	18: 10,
	20: 12,
	22: 14,
	24: 14,
	26: 16,
	32: 18,
	36: 24,
	40: 24,
	44: 24,
	48: 28,
	56: 34,
	64: 44,
	80: 48,
	96: 66,
	108: 66,
	112: 66,
	128: 72,
};

const Relation: any = { small: {}, big: {} };

for (const i in I.RelationType) {
	const it = Number(i);

	if (isNaN(Number(it)) || [ I.RelationType.Icon, I.RelationType.Relations ].includes(it)) {
		continue;
	};

	const key = UtilCommon.toCamelCase(I.RelationType[i]);

	Relation.small[i] = require(`img/icon/relation/small/${key}.svg`).default;
	Relation.big[i] = require(`img/icon/relation/big/${key}.svg`).default;
};

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
		const { id, name, iconEmoji, iconImage, iconOption, iconClass, done, relationFormat, isDeleted } = object || {};
		const cn = [ 'iconObject', 'c' + size, UtilData.layoutClass(object.id, layout) ];
		const iconSize = this.iconSize();
		const tc = commonStore.getThemeClass();

		if (className) {
			cn.push(className);
		};
		if (canEdit) {	
			cn.push('canEdit');
		};

		let icon = null;
		let icn = [];

		const onLetter = () => {
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
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} objectId={iconImage} />;
				} else 
				if (forceLetter) {
					onLetter();
				};
				break;
			};

			case I.ObjectLayout.Human: 
			case I.ObjectLayout.Participant: {
				if (iconImage) {
					cn.push('withImage');
					icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
					icon = <img src={commonStore.imageUrl(iconImage, iconSize * 2)} className={icn.join(' ')} />;
				} else {
					icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
					icon = <img src={this.userSvg()} className={icn.join(' ')} />;
				};
				break;
			};

			case I.ObjectLayout.Task: {
				icn = icn.concat([ 'iconCheckbox', 'c' + iconSize ]);
				icon = <img id="checkbox" src={done ? CheckboxTask[tc][2] : CheckboxTask[tc][0]} className={icn.join(' ')} />;
				break;
			};

			case I.ObjectLayout.Dashboard:
			case I.ObjectLayout.Note: {
				break;
			};

			case I.ObjectLayout.Type: {
				if (iconEmoji) {
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} objectId={iconImage} />;
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
					icon = <IconEmoji {...this.props} className={icn.join(' ')} iconClass={iconClass} size={iconSize} icon={iconEmoji} objectId={iconImage} />;
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

			case I.ObjectLayout.Bookmark: {
				if (iconImage) {
					icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
					icon = <img src={commonStore.imageUrl(iconImage, iconSize * 2)} className={icn.join(' ')} />;
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
					icon = <img src={UtilFile.iconImage(object)} className={icn.join(' ')} />;
				};
				break;
			};

			case I.ObjectLayout.Video:
			case I.ObjectLayout.Audio:
			case I.ObjectLayout.Pdf:
			case I.ObjectLayout.File: {
				icn = icn.concat([ 'iconFile', 'c' + iconSize ]);
				icon = <img src={UtilFile.iconImage(object)} className={icn.join(' ')} />;
				break;
			};

			case I.ObjectLayout.SpaceView: {
				if (iconImage) {
					cn.push('withImage');
					icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
					icon = <img src={commonStore.imageUrl(iconImage, iconSize * 2)} className={icn.join(' ')} />;
				} else 
				if (iconOption) {
					cn.push('withOption withImage');

					icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
					icon = <img src={this.gradientSvg(0.35)} className={icn.join(' ')} />;
				}
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
		return (getObject ? getObject() : this.props.object) || {};
	};

	onClick (e: any) {
		if (this.props.noClick) {
			e.stopPropagation();
		};
	};

	onMouseEnter (e: any) {
		const { canEdit, tooltip, tooltipY, onMouseEnter } = this.props;
		const tc = commonStore.getThemeClass();
		const node = $(this.node);
		const object = this.getObject();

		if (tooltip) {
			Preview.tooltipShow({ text: tooltip, element: node, typeY: tooltipY });
		};

		if (canEdit && (object.layout == I.ObjectLayout.Task)) {
			node.find('#checkbox').attr({ src: object.done ? CheckboxTask[tc][2] : CheckboxTask[tc][1] });
		};
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	onMouseLeave (e: any) {
		const { canEdit, onMouseLeave } = this.props;
		const tc = commonStore.getThemeClass();
		const node = $(this.node);
		const object = this.getObject();
		
		Preview.tooltipHide(false);

		if (canEdit && (object.layout == I.ObjectLayout.Task)) {
			node.find('#checkbox').attr({ src: object.done ? CheckboxTask[tc][2] : CheckboxTask[tc][0] });
		};
		
		if (onMouseLeave) {
			onMouseLeave(e);
		};
	};

	onMouseDown (e: any) {
		const { canEdit, onClick, onCheckbox } = this.props;
		const object = this.getObject();
		const { layout } = object;
		const isTask = layout == I.ObjectLayout.Task;
		const isEmoji = LAYOUT_EMOJI.includes(layout);

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
			onCheckbox(e);
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
		const { iconEmoji, iconImage, layout } = object;
		const noGallery = this.props.noGallery || (layout == I.ObjectLayout.SpaceView);
		const noUpload = this.props.noUpload || (layout == I.ObjectLayout.Type);

		menuStore.open('smile', { 
			element: `#${id}`,
			offsetX,
			offsetY,
			data: {
				noGallery,
				noUpload,
				noRemove: noRemove || !(iconEmoji || iconImage),
				onSelect: (icon: string) => {
					if (onSelect) {
						onSelect(icon);
					};
				},
				onUpload: (objectId: string) => {
					if (onUpload) {
						onUpload(objectId);
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
		if ((size == 48) && (layout == I.ObjectLayout.Relation)) {
			s = 28;
		};

		if ([ I.ObjectLayout.Human, I.ObjectLayout.Participant ].includes(layout) && (size >= 40)) {
			s = size;
		};

		if ([ I.ObjectLayout.Set, I.ObjectLayout.SpaceView ].includes(layout) && iconImage) {
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
		return Theme[commonStore.getThemeClass()]?.icon.bg[this.props.color];
	};

	svgColor () {
		return Theme[commonStore.getThemeClass()]?.icon.text;
	};

	userSvg (): string {
		const object = this.getObject();
		const { layout } = object;
		const iconSize = this.iconSize();
		const name = this.iconName();
		
		const circle = `<circle cx="50%" cy="50%" r="50%" fill="${this.svgBgColor()}" />`;
		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="${this.svgColor()}" font-family="Helvetica" font-weight="medium" font-size="${this.fontSize(layout, iconSize)}px">${name}</text>`;
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${iconSize} ${iconSize}" xml:space="preserve" height="${iconSize}px" width="${iconSize}px">
				${circle}
				${text}
			</svg>
		`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	gradientSvg (radius: number): string {
		const object = this.getObject();
		const iconSize = this.iconSize();
		const option = Colors.gradientIcons.options[object.iconOption - 1] as any;
		const steps = option.steps || Colors.gradientIcons.common.steps;

		const gradient = `
			<defs>
				<radialGradient id="gradient">
					<stop offset="${steps.from}" stop-color="${option.colors.from}" />
					<stop offset="${steps.to}" stop-color="${option.colors.to}" />
				</radialGradient>
			</defs>
		`;

		const circle = `<circle cx="50%" cy="50%" r="${radius * 100}%" fill="url(#gradient)" />`;
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${iconSize} ${iconSize}" xml:space="preserve" height="${iconSize}px" width="${iconSize}px">
				${gradient}
				${circle}
			</svg>
		`;

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

		let name = String(object.name || translate('defaultNamePage'));
		name = UtilSmile.strip(name);
		name = name.trim().substring(0, 1).toUpperCase();

		return name;
	};

});

export default IconObject;
