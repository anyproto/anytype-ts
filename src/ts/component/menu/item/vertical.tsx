import * as React from 'react';
import $ from 'jquery';
import { Icon, IconObject, Switch, Select, ObjectName } from 'Component';
import { I, U } from 'Lib';

class MenuItemVertical extends React.Component<I.MenuItem> {

	node: any = null;
	refSwitch: any = null;

	render () {
		const { 
			icon, object, inner, name, description, caption, color, arrow, checkbox, isActive, withDescription, withSwitch, withSelect, withMore, withPlural, withPronoun,
			className, style, iconSize, switchValue, selectValue, options, readonly, onClick, onSwitch, onSelect, onMouseEnter, onMouseLeave, onMore,
			selectMenuParam, subComponent, note, sortArrow, isDiv, isSection, index
		} = this.props;
		const id = this.props.id || '';
		const cn = [];
		const withArrow = arrow || subComponent;

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
		let nameElement = <div className="name">{name}</div>;

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
		} else
		if (isSection) {
			content = name;
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
						ref={ref => this.refSwitch = ref}
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
							<div className="caption" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(caption) }} />
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

		return (
			<div 
				ref={node => this.node = node}
				id={`item-${id}`} 
				className={cn.join(' ')} 
				onClick={hasClick ? onClick : undefined}
				onMouseEnter={onMouseEnter} 
				onMouseLeave={onMouseLeave}
				onContextMenu={hasClick && withMore ? onMore : undefined}
				style={style}
			>
				{content}
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
	};

	resize () {
		const node = $(this.node);
		
		if (!node.hasClass('withIcon')) {
			node.toggleClass('withIconObject', !!node.find('.iconObject').length);
		};
	};

};

export default MenuItemVertical;
