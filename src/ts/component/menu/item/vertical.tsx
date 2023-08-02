import * as React from 'react';
import $ from 'jquery';
import { Icon, IconObject, Switch, Select } from 'Component';
import { I } from 'Lib';

class MenuItemVertical extends React.Component<I.MenuItem> {

	node: any = null;

	render () {
		const { 
			id, icon, object, inner, name, description, caption, color, arrow, checkbox, isActive, withDescription, withSwitch, withSelect, withMore,
			className, style, iconSize, switchValue, selectValue, options, readonly, forceLetter, onClick, onSwitch, onSelect, onMouseEnter, onMouseLeave, onMore,
			selectMenuParam,
		} = this.props;
		const cn = [ 'item' ];

		let hasClick = true;

		if (className) {
			cn.push(className);
		};
		if (color) {
			cn.push(color + ' withColor');
		};
		if (arrow) {
			cn.push('withChildren');
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

		let iconElement = null;
		if (object) {
			iconElement = <IconObject object={object} size={iconSize} forceLetter={forceLetter} />;

			if (object.isHidden) {
				cn.push('isHidden');
			};
		} else 
		if (icon) {
			cn.push('withIcon');
			iconElement = <Icon className={[ icon, 'iconMain' ].join(' ')} inner={inner} />;
		};

		let content = null;
		if (withDescription) {
			content = (
				<React.Fragment>
					{iconElement}
					<div className="info">
						<div className="txt">
							<div className="name">{name}</div>
							<div className="descr">{description}</div>
						</div>
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
							<div className="caption" dangerouslySetInnerHTML={{ __html: caption }} />
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
						{iconElement}
						<div className="name">{name}</div>
					</div>
					{additional}
				</React.Fragment>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				id={'item-' + id} 
				className={cn.join(' ')} 
				onMouseDown={hasClick ? onClick : undefined}
				onMouseEnter={onMouseEnter} 
				onMouseLeave={onMouseLeave} 
				style={style}
			>
				{content}
				{arrow ? <Icon className="arrow" /> : ''}
				{checkbox ? <Icon className="chk" /> : ''}
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
		
		if (node.hasClass('withIcon')) {
			return;
		};

		const icon = node.find('.iconObject');
		icon.length ? node.addClass('withIconObject') : node.removeClass('withIconObject');
	};

};

export default MenuItemVertical;
