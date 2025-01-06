import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconEmoji } from 'Component';
import { I, S, U, J, Preview, translate, Relation } from 'Lib';

interface Props {
	id?: string;
	layout?: I.ObjectLayout;
	object?: any;
	className?: string;
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

interface IconObjectRefProps {
	setObject(object: any): void;
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
	108: 64,
	128: 64,
};

const DefaultIcons = [ 'page', 'task', 'set', 'chat', 'bookmark', 'type', 'date' ];
const Ghost = require('img/icon/ghost.svg');

const CheckboxTask = {
	'': {
		0: require('img/icon/object/checkbox0.svg'),
		1: require('img/icon/object/checkbox1.svg'),
		2: require('img/icon/object/checkbox2.svg'),
	},
	dark: {
		0: require('img/icon/object/checkbox0.svg'),
		1: require('img/theme/dark/icon/object/checkbox1.svg'),
		2: require('img/icon/object/checkbox2.svg'),
	},
};

const IconObject = observer(forwardRef<IconObjectRefProps, Props>((props, ref) => {
	const {
		className = '',
		canEdit = false,
		size = 20,
		offsetX = 0,
		offsetY = 0,
		tooltip = '',
		tooltipY = I.MenuDirection.Bottom,
		noRemove = false,
		noClick = false,
		menuParam = {},
		style = {},
		getObject,
		onSelect,
		onUpload,
		onClick,
		onCheckbox,
		onMouseEnter,
		onMouseLeave,
	} = props;

	const theme = S.Common.getThemeClass();
	const nodeRef = useRef(null);
	const checkboxRef = useRef(null);
	
	let object: any = getObject ? getObject() : props.object || {};

	const [ stateObject, setStateObject ] = useState(null);

	if (stateObject) {
		object = Object.assign(object, stateObject || {});
	};

	const layout = Number(object.layout) || I.ObjectLayout.Page;
	const { id, name, iconEmoji, iconImage, iconOption, done, relationFormat, isDeleted } = object || {};
	const cn = [ 'iconObject', `c${size}`, className, U.Data.layoutClass(object.id, layout) ];
	const iconSize = props.iconSize || IconSize[size];

	if (canEdit) {	
		cn.push('canEdit');
	};

	let icon = null;
	let icn = [];

	const onClickHandler = (e: any) => {
		if (noClick) {
			e.stopPropagation();
		};
	};

	const onMouseEnterHandler = (e: any) => {
		if (tooltip) {
			Preview.tooltipShow({ text: tooltip, element: $(nodeRef.current), typeY: tooltipY });
		};

		if (canEdit && U.Object.isTaskLayout(object.layout)) {
			$(checkboxRef.current).attr({ src: object.done ? CheckboxTask[theme][2] : CheckboxTask[theme][1] });
		};
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	const onMouseLeaveHandler = (e: any) => {
		Preview.tooltipHide(false);

		if (canEdit && U.Object.isTaskLayout(object.layout)) {
			$(checkboxRef.current).attr({ src: object.done ? CheckboxTask[theme][2] : CheckboxTask[theme][0] });
		};
		
		if (onMouseLeave) {
			onMouseLeave(e);
		};
	};

	const onMouseDown = (e: any) => {
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
			onEmoji(e);
		};

		onMouseLeaveHandler(e);
	};

	const onEmoji = (e: any) => {
		e.stopPropagation();

		const noGallery = props.noGallery || [ I.ObjectLayout.SpaceView, I.ObjectLayout.Human ].includes(object.layout);
		const noUpload = props.noUpload || [ I.ObjectLayout.Type ].includes(object.layout);

		S.Menu.open('smile', { 
			element: `#${props.id}`,
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

	const fontSize = (size: number): number => {
		return Math.min(72, FontSize[size]);
	};

	const fontWeight = (size: number): number => {
		return size > 18 ? 600 : 500;
	};

	const userSvg = (): string => {
		const color = J.Theme[theme]?.iconUser;
		const circle = `<circle cx="50%" cy="50%" r="50%" fill="${color.bg}" />`;
		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="${color.text}" font-family="Inter, Helvetica" font-weight="${fontWeight(size)}" font-size="${fontSize(size)}px">${iconName()}</text>`;
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${size} ${size}" xml:space="preserve" height="${size}px" width="${size}px">
				${circle}
				${text}
			</svg>
		`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	const spaceSvg = (option: number): string => {
		const { bg, list } = J.Theme.iconSpace;
		const bgColor = bg[list[option - 1]];

		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="Inter, Helvetica" font-weight="${fontWeight(size)}" font-size="${fontSize(size)}px">${iconName()}</text>`;
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${size} ${size}" xml:space="preserve" height="${size}px" width="${size}px">
				<rect width="${size}" height="${size}" fill="${bgColor}"/>
				${text}
			</svg>
		`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	const iconName = (): string => {
		let ret = String(name || translate('defaultNamePage'));
		ret = U.Smile.strip(ret);
		ret = ret.trim().substring(0, 1).toUpperCase();
		ret = U.Common.htmlSpecialChars(ret);
		return ret;
	};

	const defaultIcon = (type: string) => {
		if (!DefaultIcons.includes(type)) {
			return;
		};

		const src = require(`img/icon/default/${type}.svg`);

		cn.push('withDefault');
		icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
		icon = <img src={src} className={icn.join(' ')} />;
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

			if (iconEmoji || iconImage) {
				icon = <IconEmoji {...props} className={icn.join(' ')} size={iconSize} icon={iconEmoji} objectId={iconImage} />;
			} else {
				defaultIcon(di);
			};
			break;
		};

		case I.ObjectLayout.Date:
			defaultIcon('date');
			break;

		case I.ObjectLayout.Collection:
		case I.ObjectLayout.Set: {
			if (iconImage) {
				cn.push('withImage');
			};

			if (iconEmoji || iconImage) {
				icon = <IconEmoji {...props} className={icn.join(' ')} size={iconSize} icon={iconEmoji} objectId={iconImage} />;
			} else {
				defaultIcon('set');
			};
			break;
		};

		case I.ObjectLayout.Human: 
		case I.ObjectLayout.Participant: {
			icn = icn.concat([ 'iconImage', 'c' + size ]);

			if (iconImage) {
				cn.push('withImage');
				icon = <img src={S.Common.imageUrl(iconImage, size * 2)} className={icn.join(' ')} />;
			} else {
				icon = <img src={userSvg()} className={icn.join(' ')} />;
			};
			break;
		};

		case I.ObjectLayout.Task: {
			icn = icn.concat([ 'iconCheckbox', 'c' + iconSize ]);
			icon = <img ref={checkboxRef} src={done ? CheckboxTask[theme][2] : CheckboxTask[theme][0]} className={icn.join(' ')} />;
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
				icon = <IconEmoji {...props} className={icn.join(' ')} size={iconSize} icon={iconEmoji} objectId={iconImage} />;
			} else {
				defaultIcon('type');
			};
			break;
		};

		case I.ObjectLayout.Relation: {
			if ([ I.RelationType.Icon, I.RelationType.Relations ].includes(relationFormat)) {
				break;
			};

			icn = icn.concat([ 'iconCommon', 'c' + iconSize ]);
			icon = <img src={`./img/icon/relation/${Relation.typeName(relationFormat)}.svg`} className={icn.join(' ')} />;
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
				icon = <img src={U.File.iconPath(object)} className={icn.join(' ')} />;
			};
			break;
		};

		case I.ObjectLayout.Video:
		case I.ObjectLayout.Audio:
		case I.ObjectLayout.Pdf:
		case I.ObjectLayout.File: {
			icn = icn.concat([ 'iconFile', 'c' + iconSize ]);
			icon = <img src={U.File.iconPath(object)} className={icn.join(' ')} />;
			break;
		};

		case I.ObjectLayout.SpaceView: {
			icn = icn.concat([ 'iconImage', 'c' + iconSize ]);
			cn.push('withImage');

			if (iconImage) {
				icon = <img src={S.Common.imageUrl(iconImage, iconSize * 2)} className={icn.join(' ')} />;
			} else {
				cn.push('withOption');
				icon = <img src={spaceSvg(iconOption)} className={icn.join(' ')} />;
			};
			break;
		};

	};

	if (isDeleted) {
		icon = <img src={Ghost} className={[ 'iconCommon', `c${iconSize}` ].join(' ')} />;
	};

	useImperativeHandle(ref, () => ({
		setObject: object => setStateObject(object),
	}));

	if (!icon) {
		return null;
	};

	return (
		<div 
			ref={nodeRef}
			id={props.id} 
			className={cn.join(' ')} 
			onClick={onClickHandler}
			onMouseDown={onMouseDown} 
			onMouseEnter={onMouseEnterHandler} 
			onMouseLeave={onMouseLeaveHandler}
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

}));

export default IconObject;