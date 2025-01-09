import * as React from 'react';
import $ from 'jquery';
import { Icon, IconObject, Switch, Select, ObjectName } from 'Component';
import { I, U } from 'Lib';

class MenuItemVertical extends React.Component<I.MenuItem> {

	node: any = null;

	render () {
		const { 
			icon, object, inner, name, description, caption, color, arrow, checkbox, isActive, withDescription, withSwitch, withSelect, withMore,
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
			nameElement = <ObjectName object={object} />;

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
					tooltip={note}
					tooltipY={I.MenuDirection.Top}
					tooltipClassName="menuNote"
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
				<React.Fragment>
					{iconMainElement}
					<div className="info">
						<div className="txt">
							{nameElement}
							<div className="descr">{description}</div>
						</div>
						{iconSideElement}
					</div>
				</React.Fragment>
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
					<React.Fragment>
						{typeof caption === 'string' ? (
							<div className="caption" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(caption) }} />
						) : (
							<div className="caption">{caption}</div>
						)}
						{withMore ? <Icon className="more" onMouseDown={onMore} /> : ''}
					</React.Fragment>
				);
			};

			content = (
				<React.Fragment>
					<div 
						className="clickable" 
						onMouseDown={hasClick ? undefined : onClick}
					>
						{iconMainElement}
						{nameElement}
						{iconSideElement}
					</div>
					{additional}
				</React.Fragment>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				id={`item-${id}`} 
				className={cn.join(' ')} 
				onMouseDown={hasClick ? onClick : undefined}
				onMouseEnter={onMouseEnter} 
				onMouseLeave={onMouseLeave} 
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
