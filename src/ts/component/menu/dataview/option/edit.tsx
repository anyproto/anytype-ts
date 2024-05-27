import * as React from 'react';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import $ from 'jquery';
import { I, C, UtilMenu, Relation, translate, keyboard, analytics } from 'Lib';
import { Filter, MenuItemVertical, Icon } from 'Component';
import { menuStore, popupStore } from 'Store';
const Constant = require('json/constant.json');

const MenuOptionEdit = observer(class MenuOptionEdit extends React.Component<I.Menu> {
	
	refName = null;
	color = '';
	timeout = 0;
	n = -1;

	render () {
		const { param } = this.props;
		const { data } = param;
		const { option } = data;
		const sections = this.getSections();

		const Color = (item: any) => (
			<div
				id={`item-${item.id}`}
				className={[ 'item', 'color', `color-${item.className}` ].join(' ')}
				onClick={e => this.onClick(e, item)}
				onMouseEnter={e => this.onMouseEnter(e, item)}
			>
				{this.color == item.value ? <Icon className="tick" /> : ''}
			</div>
		);

		const Section = (item: any) => (
			<div className={[ 'section', (item.className ? item.className : '') ].join(' ')}>
				<div className="items">
					{item.children.map((action: any, i: number) => {
						if (action.isBgColor) {
							return <Color key={i} {...action} />;
						};

						return (
							<MenuItemVertical 
								key={i} 
								{...action} 
								onClick={e => this.onClick(e, action)}
								onMouseEnter={e => this.onMouseEnter(e, action)}
							/>
						);
					})}
				</div>
			</div>
		);

		return (
			<div>
				<Filter
					ref={ref => this.refName = ref}
					placeholder={translate('menuDataviewOptionEditPlaceholder')}
					placeholderFocus={translate('menuDataviewOptionEditPlaceholder')}
					className={'outlined textColor-' + this.color}
					value={option.name}
					onKeyUp={(e: any, v: string) => { this.onKeyUp(e, v); }}
				/>

				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { option } = data;

		this.color = option.color;
		this.rebind();
		this.forceUpdate();
	};

	componentDidUpdate () {
		this.props.setActive();
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeout);
	};

	focus () {
		window.setTimeout(() => { 
			if (this.refName) {
				this.refName.focus(); 
			};
		}, 15);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getSections () {
		const colors = UtilMenu.getBgColors().filter(it => it.id != 'bgColor-default');

		return [
			{ children: colors, className: 'colorPicker' },
			{ 
				children: [
					{ id: 'remove', icon: 'remove', name: translate('menuDataviewOptionEditDelete') }
				] 
			},
		];
	};

	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	onKeyDown (e: any) {
		window.clearTimeout(this.timeout);

		let ret = false;

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			this.save();
			this.props.close();

			ret = true;
		});

		if (!ret) {
			this.props.onKeyDown(e);
		};
	};

	onKeyUp (e: any, v: string) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.save(), Constant.delay.keyboard);
	};

	onClick (e: any, item: any) {
		if (item.isBgColor) {
			this.color = item.value;
			this.save();
			this.forceUpdate();
		} else
		if (item.id == 'remove') {
			popupStore.open('confirm', {
				data: {
					icon: 'confirm',
					bgColor: 'red',
					title: translate('commonAreYouSure'),
					text: translate('popupConfirmRelationOptionRemoveText'),
					textConfirm: translate('commonDelete'),
					onConfirm: () => {
						this.remove();
					}
				}
			});
		};
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	remove () {
		const { param, close, id } = this.props;
		const { data } = param;
		const { option, onChange } = data;
		const value = Relation.getArrayValue(data.value).filter(it => it != option.id);

		C.RelationListRemoveOption([ option.id ], false);

		menuStore.updateData(id, { value });
		menuStore.updateData('dataviewOptionList', { value });

		if (onChange) {
			onChange(value);
		};

		close();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { option } = data;
		const value = this.refName ? this.refName.getValue() : '';

		if (!value) {
			return;
		};

		C.ObjectListSetDetails([ option.id ], [ 
			{ key: 'name', value },
			{ key: 'relationOptionColor', value: this.color },
		]);
	};
	
});

export default MenuOptionEdit;
