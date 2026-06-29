import React, { forwardRef, useRef, useEffect } from 'react';
import { Icon, IconObject, Switch, Select, ObjectName } from 'Component';
import * as I from 'Interface';

const MenuItemVertical = forwardRef<{}, I.MenuItem>((props, ref) => {

	const {
		id = '', iconParam, object, inner, name, description, caption, color, arrow, checkbox, isActive, withDescription, withSwitch, withSelect, withMore, withCopy, withPlural, withPronoun,
		className, style, iconSize, switchValue, selectValue, options, readonly, selectMenuParam, subComponent, note, sortArrow, isDiv, isSection, index,
		onClick, onSwitch, onSelect, onMouseEnter, onMouseLeave, onMore, onContextMenu, tooltipParam = {},
	} = props;
	const cn = [];
	const withArrow = arrow || subComponent;
	const nodeRef = useRef(null);

	if (isDiv) {
		cn.push('separator');
	} else 
	if (isSection) {
		cn.push('sectionName');

		if (!index) {
			cn.push('first');
		};
	} else {
		cn.push('item');
	};

	let hasClick = true;
	let iconMainElement = null;
	let iconSideElement = null;
	let nameElement = null;

	if ('string' == typeof name) {
		nameElement = <div className="name" dangerouslySetInnerHTML={{ __html: U.String.sanitize(name) }} />;
	} else {
		nameElement = <div className="name">{name}</div>;
	};

	if (className) {
		cn.push(className);
	};
	if (color) {
		cn.push(`textColor textColor-${color}`);
	};
	if (withArrow) {
		cn.push('withArrow');
	};
	if (withDescription) {
		cn.push('withDescription');
	};
	if (caption) {
		cn.push('withCaption');
	};
	if (withSwitch) {
		hasClick = false;
		cn.push('withSwitch');
	};
	if (withSelect) {
		hasClick = false;
		cn.push('withSelect');
	};
	if (checkbox) {
		cn.push('withCheckbox');
	};
	if (withMore) {
		cn.push('withMore');
	};
	if (withCopy) {
		cn.push('withCopy');
	};
	if (isActive) {
		cn.push('active');
	};
	if (readonly) {
		cn.push('isReadonly');
	};

	if (object) {
		iconMainElement = <IconObject object={object} size={iconSize} />;

		if (!name) {
			nameElement = <ObjectName object={object} withPlural={withPlural} withPronoun={withPronoun} />;
		};

		if (object.isHidden) {
			cn.push('isHidden');
		};
	} else
	if (iconParam) {
		cn.push('withIcon');
		
		const icn = [ 'iconMain' ];
		if (iconParam.className) {
			icn.push(iconParam.className);
		};

		iconMainElement = <Icon {...iconParam} className={icn.join(' ')} inner={inner} />;
	};

	if (withArrow) {
		iconSideElement = <Icon name="arrow/item" className="arrow" />;
	};
	if (checkbox) {
		iconSideElement = <Icon name="menu/common/chk" className="chk" />;
	};
	if (note) {
		cn.push('withNote');
		iconSideElement = (
			<Icon
				className="note"
				tooltipParam={{ text: note, className: 'menuNote' }}
			/>
		);
	};
	if (undefined !== sortArrow) {
		cn.push('withSortArrow');
		iconSideElement = <Icon name="common/sortArrow" className={`sortArrow c${sortArrow}`} />;
	};

	let content = null;
	if (isDiv) {
		content = <div className="inner" />;
		hasClick = false;
	} else
	if (isSection) {
		content = nameElement;
		hasClick = false;
	} else
	if (withDescription) {
		content = (
			<>
				{iconMainElement}
				<div className="info">
					<div className="txt">
						{nameElement}
						<div className="descr">{description}</div>
					</div>
					{iconSideElement}
				</div>
			</>
		);
	} else {
		let additional = null;
		if (withSwitch) {
			additional = (
				<Switch 
					value={switchValue} 
					readonly={readonly}
					onChange={onSwitch} 
				/>
			);
		} else 
		if (withSelect) {
			additional = (
				<Select
					id={`select-${id}`}
					value={selectValue} 
					options={options}
					onChange={onSelect}
					{...selectMenuParam}
				/>
			);
		} else {
			additional = (
				<>
					{typeof caption === 'string' ? (
						<div className="caption" dangerouslySetInnerHTML={{ __html: U.String.sanitize(caption) }} />
					) : (
						<div className="caption">{caption}</div>
					)}
					{withMore ? <Icon name="common/more" className="more" withBackground={true} onMouseDown={onMore} /> : ''}
					{withCopy ? <Icon name="menu/action/copy" className="copy" withBackground={true} /> : ''}
				</>
			);
		};

		content = (
			<>
				<div 
					className="clickable" 
					onClick={hasClick ? undefined : onClick}
					onContextMenu={onContextMenu || (!hasClick && withMore ? onMore : undefined)}
				>
					{iconMainElement}
					{nameElement}
					{iconSideElement}
				</div>
				{additional}
			</>
		);
	};

	const resize = () => {
		const node = nodeRef.current;

		if (node && !U.Dom.hasClass(node, 'withIcon')) {
			U.Dom.toggleClass(node, 'withIconObject', !!U.Dom.selectAll('.iconObject', node).length);
		};
	};

	const onMouseEnterHandler = (e: any) => {
		const { text = '', caption = '' } = tooltipParam;
		const t = Preview.tooltipCaption(text, caption);

		if (t) {
			Preview.tooltipShow({ ...tooltipParam, text: t, element: nodeRef.current });
		};
		
		onMouseEnter?.(e);
	};
	
	const onMouseLeaveHandler = (e: any) => {
		Preview.tooltipHide(false);
		onMouseLeave?.(e);
	};

	useEffect(() => resize());

	return (
		<div 
			ref={nodeRef}
			id={`item-${id}`} 
			className={cn.join(' ')} 
			onClick={hasClick ? onClick : undefined}
			onMouseEnter={onMouseEnterHandler} 
			onMouseLeave={onMouseLeaveHandler}
			onContextMenu={onContextMenu || (hasClick && withMore ? onMore : undefined)}
			style={style}
		>
			{content}
		</div>
	);

});

export default MenuItemVertical;