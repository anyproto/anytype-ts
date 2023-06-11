import * as React from 'react';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import $ from 'jquery';
import { I, C, UtilMenu, Relation, translate, keyboard } from 'Lib';
import { Filter, MenuItemVertical } from 'Component';
import { menuStore } from 'Store';

const MenuOptionEdit = observer(class MenuOptionEdit extends React.Component<I.Menu> {
	
	refName: any = null;
	color: string = null;
	timeout = 0;
	n = -1;

	render () {
		const { param } = this.props;
		const { data } = param;
		const { option } = data;
		const sections = this.getSections();

		const Section = (item: any) => (
			<div className="section">
				<div className="items">
					{item.children.map((action: any, i: number) => {
						if (action.isBgColor) {
							action.inner = <div className={`inner isTag textColor textColor-${action.className}`} />;
							action.icon = 'color';
							action.checkbox = action.value == this.color;
						};

						return (
							<MenuItemVertical 
								key={i} 
								{...action} 
								onClick={(e: any) => { this.onClick(e, action); }}
								onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }}
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
					className={'textColor-' + this.color}
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
		this.unbind();
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
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getSections () {
		const colors = UtilMenu.getBgColors().filter(it => it.id != 'bgColor-default');

		return [
			{ children: colors },
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
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	onKeyDown (e: any) {
		window.clearTimeout(this.timeout);

		let ret = false;

		keyboard.shortcut('enter', e, (pressed: string) => {
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
		this.timeout = window.setTimeout(() => { this.save(); }, 500);
	};


	onClick (e: any, item: any) {
		if (item.isBgColor) {
			this.color = item.value;
			this.save();
			this.forceUpdate();
		} else
		if (item.id == 'remove') {
			this.remove();
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
		const relation = data.relation.get();
		
		let value = Relation.getArrayValue(data.value);
		value = value.filter(it => it != option.id);

		C.RelationListRemoveOption([ option.id ], false);

		menuStore.updateData(id, { value });
		menuStore.updateData('dataviewOptionList', { 
			value: value, 
			relation: observable.box(relation),
		});
		
		onChange(value);
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

		C.ObjectSetDetails(option.id, [ 
			{ key: 'name', value },
			{ key: 'relationOptionColor', value: this.color },
		]);
	};
	
});

export default MenuOptionEdit;