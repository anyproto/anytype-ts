import React, { forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import { Icon, IconObject, Switch, Select, ObjectName } from 'Component';
import { I, U, Preview } from 'Lib';

const MenuItemVertical = forwardRef<{}, I.MenuItem>((props, ref) => {

	const { 
		id = '', icon, object, inner, name, description, caption, color, arrow, checkbox, isActive, withDescription, withSwitch, withSelect, withMore, withPlural, withPronoun,
		className, style, iconSize, switchValue, selectValue, options, readonly, selectMenuParam, subComponent, note, sortArrow, isDiv, isSection, index,
		onClick, onSwitch, onSelect, onMouseEnter, onMouseLeave, onMore, tooltipParam = {},
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
	if (isActive) {
		cn.push('active');
	};
	if (readonly) {
		cn.push('isReadonly');
	};

	if (object) {
		iconMainElement = <IconObject object={object} size={iconSize} />;
		nameElement = <ObjectName object={object} withPlural={withPlural} withPronoun={withPronoun} />;

		if (object.isHidden) {
			cn.push('isHidden');
		};
	} else 
	if (icon) {
		cn.push('withIcon');
		iconMainElement = <Icon className={[ icon, 'iconMain' ].join(' ')} inner={inner} />;
	};

	if (withArrow) {
		iconSideElement = <Icon className="arrow" />;
	};
	if (checkbox) {
		iconSideElement = <Icon className="chk" />;
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
		iconSideElement = <Icon className={`sortArrow c${sortArrow}`} />;
	};

	let content = null;
	if (isDiv) {
		content = <div className="inner" />;
		hasClick = false;
	} else
	if (isSection) {
		content = name;
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
					{withMore ? <Icon className="more withBackground" onMouseDown={onMore} /> : ''}
				</>
			);
		};

		content = (
			<>
				<div 
					className="clickable" 
					onClick={hasClick ? undefined : onClick}
					onContextMenu={!hasClick && withMore ? onMore : undefined}
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
		const node = $(nodeRef.current);
		
		if (!node.hasClass('withIcon')) {
			node.toggleClass('withIconObject', !!node.find('.iconObject').length);
		};
	};

	const onMouseEnterHandler = (e: any) => {
		const { text = '', caption = '' } = tooltipParam;
		const t = Preview.tooltipCaption(text, caption);

		if (t) {
			Preview.tooltipShow({ ...tooltipParam, text: t, element: $(nodeRef.current) });
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
			onContextMenu={hasClick && withMore ? onMore : undefined}
			style={style}
		>
			{content}
		</div>
	);

});

export default MenuItemVertical;