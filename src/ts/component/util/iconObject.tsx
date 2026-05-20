import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Icon, IconEmoji } from 'Component';

import { getIcon, getIconSvg } from './icons';
import * as I from 'Interface';

interface Props {
	id?: string;
	layout?: I.ObjectLayout;
	object?: any;
	className?: string;
	color?: string;
	canEdit?: boolean;
	native?: boolean;
	size?: number;
	iconSize?: number;
	menuId?: string;
	noGallery?: boolean;
	noUpload?: boolean;
	noRemove?: boolean;
	noClick?: boolean;
	menuParam?: Partial<I.MenuParam>;
	tooltipParam?: Partial<I.TooltipParam>;
	style?: any;
	getObject?(): any;
	onSelect?(id: string): void;
	onIconSelect?(id: string, color: number): void;
	onUpload?(objectId: string): void;
	onClick?(e: any): void;
	onCheckbox?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
};

interface IconObjectRefProps {
	setObject(object: any): void;
};

const getLayoutsWithEmojiGallery = (): I.ObjectLayout[] => [
	I.ObjectLayout.Page,
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
	80: 48,
	96: 64,
	128: 72,
};

const GhostIcon = getIcon('common/ghost');

const CheckboxTask = {
	0: 'object/checkbox0',
	1: 'object/checkbox1',
	2: 'object/checkbox2',
};

const IconObject = forwardRef<IconObjectRefProps, Props>((props, ref) => {
	const {
		className = '',
		canEdit = false,
		size = 20,
		noRemove = false,
		noClick = false,
		menuParam = {},
		tooltipParam = {},
		style = {},
		getObject,
		onSelect,
		onIconSelect,
		onUpload,
		onClick,
		onCheckbox,
		onMouseEnter,
		onMouseLeave,
	} = props;

	const theme = S.Common.getThemeClass();
	const nodeRef = useRef(null);
	const [ stateObject, setStateObject ] = useState(null);
	const [ isCheckboxHovered, setIsCheckboxHovered ] = useState(false);
	
	let object: any = getObject ? getObject() : props.object || {};
	if (stateObject) {
		object = Object.assign(object, stateObject || {});
	};

	const layout = Number(object.layout) || I.ObjectLayout.Page;
	const { id, name, iconName, iconEmoji, iconImage, iconOption, done, relationFormat, relationKey, isDeleted, spaceType } = object || {};
	const cn = [ 'iconObject', `c${size}`, className, U.Data.layoutClass(object.id, layout) ];
	const iconSize = props.iconSize || IconSize[size];

	if (canEdit) {
		cn.push('canEdit');
	};
	if (done) {
		cn.push('isDone');
	};

	let icon = null;
	let icn = [];

	const onClickHandler = (e: any) => {
		if (noClick) {
			e.stopPropagation();
		};
	};

	const onMouseEnterHandler = (e: any) => {
		const { text = '', caption = '' } = tooltipParam;
		const t = Preview.tooltipCaption(text, caption);
		
		if (t) {
			Preview.tooltipShow({ ...tooltipParam, text: t, element: nodeRef.current });
		};

		if (canEdit && U.Object.isTaskLayout(object.layout)) {
			setIsCheckboxHovered(true);
		};

		onMouseEnter?.(e);
	};

	const onMouseLeaveHandler = (e: any) => {
		Preview.tooltipHide(false);

		if (canEdit && U.Object.isTaskLayout(object.layout)) {
			setIsCheckboxHovered(false);
		};
		
		onMouseLeave?.(e);
	};

	const onMouseDown = (e: any) => {
		onClick?.(e);

		if (!canEdit) {
			return;
		};

		const isTask = U.Object.isTaskLayout(layout);
		const isEmoji = getLayoutsWithEmojiGallery().includes(layout);

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

		const noGallery = props.noGallery || [ I.ObjectLayout.SpaceView, I.ObjectLayout.Human, I.ObjectLayout.Type ].includes(object.layout);
		const noUpload = props.noUpload;
		const withIcons = U.Object.isTypeLayout(object.layout);

		S.Menu.open('smile', {
			element: `#${props.id}`,
			data: {
				value: (object.iconEmoji || object.iconImage || ''),
				spaceId: object.spaceId,
				objectId: object.id,
				noGallery,
				noUpload,
				withIcons,
				noRemove,
				onSelect: (icon: string) => {
					if (onSelect) {
						onSelect(icon);
					} else {
						U.Object.setIcon(object.id, icon, '');
					};
				},
				onIconSelect: (iconName: string, iconOption: number) => {
					if (onIconSelect) {
						onIconSelect(iconName, iconOption);
					} else {
						U.Object.setTypeIcon(object.id, iconName, iconOption);
					};
				},
				onUpload: (objectId: string) => {
					if (onUpload) {
						onUpload(objectId);
					} else {
						U.Object.setIcon(object.id, '', objectId);
					};
				},
				route: analytics.route.icon
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
		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="${J.Theme[theme]?.iconUser}" font-family="Inter, Helvetica" font-weight="${fontWeight(size)}" font-size="${fontSize(size)}px">${nameString()}</text>`;
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${size} ${size}" xml:space="preserve" height="${size}px" width="${size}px">
				${text}
			</svg>
		`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	const spaceSvg = (option: number): string => {
		const textColor = U.Common.iconTextByOption(option);
		const bgColor = U.Common.iconBgByOption(option);
		const text = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="${textColor}" font-family="Inter, Helvetica" font-weight="${fontWeight(size)}" font-size="${fontSize(size)}px">${nameString()}</text>`;
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 ${size} ${size}" xml:space="preserve" height="${size}px" width="${size}px">
				<rect width="${size}" height="${size}" fill="${bgColor}"/>
				${text}
			</svg>
		`;

		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	};

	const nameString = (): string => {
		let ret = String(name || translate('defaultNamePage'));
		ret = U.Smile.strip(ret);
		ret = ret.trim().substring(0, 1).toUpperCase();
		ret = U.String.htmlSpecialChars(ret);
		return ret;
	};

	const defaultIcon = () => {
		const src = U.Object.defaultIcon(layout, object.type, size);

		cn.push('withDefault');
		icn = icn.concat([ 'iconCommon', `c${iconSize}` ]);
		icon = <img src={src} className={icn.join(' ')} />;
	};

	switch (layout) {
		default: {
			if (iconEmoji) {
				icon = <IconEmoji {...props} className={icn.join(' ')} size={iconSize} icon={iconEmoji} />;
			} else
			if (iconImage) {
				cn.push('withImage');
				icn = icn.concat([ 'iconImage', `c${iconSize}` ]);
				icon = <img src={S.Common.imageUrl(iconImage, I.ImageSize.Medium)} className={icn.join(' ')} />;
			} else {
				defaultIcon();
			};
			break;
		};

		case I.ObjectLayout.Date:
			defaultIcon();
			break;

		case I.ObjectLayout.Human: 
		case I.ObjectLayout.Participant: {
			icn = icn.concat([ 'iconImage', `c${iconSize}` ]);

			if (iconImage) {
				cn.push('withImage');
				icon = <img src={S.Common.imageUrl(iconImage, size * 2)} className={icn.join(' ')} />;
			} else {
				icon = <img src={userSvg()} className={icn.join(' ')} />;
			};
			break;
		};

		case I.ObjectLayout.Task: {
			icn = icn.concat([ 'iconCheckbox', `c${iconSize}` ]);
			const checkboxState = done ? 2 : (isCheckboxHovered ? 1 : 0);
			icon = <Icon name={CheckboxTask[checkboxState]} className={icn.join(' ')} size={iconSize} />;
			break;
		};

		case I.ObjectLayout.Dashboard: {
			break;
		};

		case I.ObjectLayout.Note: {
			defaultIcon();
			break;
		};

		case I.ObjectLayout.Type: {
			if (iconImage) {
				icn = icn.concat([ 'iconImage', `c${size}` ]);
				cn.push('withImage');
				icon = <img src={S.Common.imageUrl(iconImage, size * 2)} className={icn.join(' ')} />;
			} else
			if (iconName) {
				const typeColor = U.Common.iconBgByOption(iconOption);

				icn = icn.concat([ 'iconCommon', `c${iconSize}` ]);
				icon = (
					<Icon
						name={`type/${iconName}`}
						size={iconSize}
						className={icn.join(' ')}
						style={{ color: typeColor }}
					/>
				);
			} else
			if (iconEmoji) {
				icon = <IconEmoji {...props} className={icn.join(' ')} size={iconSize} icon={iconEmoji} />;
			} else {
				defaultIcon();
			};
			break;
		};

		case I.ObjectLayout.Relation: {
			if ([ I.RelationType.Icon ].includes(relationFormat)) {
				break;
			};

			icn = icn.concat([ 'iconRelation', `c${iconSize}` ]);
			icon = (
				<Icon
					name={Relation.registryName(relationKey, relationFormat)}
					size={iconSize}
					className={icn.join(' ')}
				/>
			);
			break;
		};

		case I.ObjectLayout.Bookmark: {
			if (iconImage) {
				icn = icn.concat([ 'iconCommon', `c${iconSize}` ]);
				icon = <img src={S.Common.imageUrl(iconImage, iconSize * 2)} className={icn.join(' ')} />;
			} else {
				defaultIcon();
			};
			break;
		};

		case I.ObjectLayout.Image: {
			if (id) {
				cn.push('withImage');
				icn = icn.concat([ 'iconImage', `c${iconSize}` ]);
				icon = <img src={S.Common.imageUrl(id, iconSize * 2)} className={icn.join(' ')} />;
			} else {
				icn = icn.concat([ 'iconFile', `c${iconSize}` ]);
				icon = <img src={U.File.iconPath(object)} className={icn.join(' ')} />;
			};
			break;
		};

		case I.ObjectLayout.Video:
		case I.ObjectLayout.Audio:
		case I.ObjectLayout.Pdf:
		case I.ObjectLayout.File: {
			icn = icn.concat([ 'iconFile', `c${iconSize}` ]);
			icon = <img src={U.File.iconPath(object)} className={icn.join(' ')} />;
			break;
		};

		case I.ObjectLayout.SpaceView: {
			icn = icn.concat([ 'iconImage', `c${iconSize}` ]);
			cn.push('withImage', U.Data.spaceClass(spaceType));

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
		icon = GhostIcon ? <GhostIcon className={[ 'iconCommon', `c${iconSize}` ].join(' ')} /> : null;
	};

	const setErrorIcon = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const svgMarkup = getIconSvg('type/image', { style: { width: iconSize, height: iconSize } });
		const existing = U.Dom.select('.iconError', node);
		if (existing) {
			existing.remove();
		};

		const div = document.createElement('div');
		div.className = `iconError c${iconSize}`;
		div.innerHTML = svgMarkup;
		node.appendChild(div);
		U.Dom.addClass(node, 'withImageError');
	};

	const unsetErrorIcon = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const errorEl = U.Dom.select('.iconError', node);
		if (errorEl) {
			errorEl.remove();
		};
		U.Dom.removeClass(node, 'withImageError');
	};

	useEffect(() => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const img = U.Dom.select('img', node) as HTMLImageElement;
		if (!img) {
			return;
		};

		const onLoad = () => unsetErrorIcon();
		const onError = () => setErrorIcon();

		U.Dom.addEvents(img, [
			['load', onLoad],
			['error', onError],
		]);

		return () => {
			U.Dom.removeEvents(img, [
				['load', onLoad],
				['error', onError],
			]);
		};
	}, []);

	useEffect(() => {
		if (U.Dom.hasClass(nodeRef.current, 'withImageError')) {
			setErrorIcon();
		};
	}, [ theme ]);

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

});

export default IconObject;