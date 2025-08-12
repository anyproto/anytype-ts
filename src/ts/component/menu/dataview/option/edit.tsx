import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, C, U, Relation, translate, keyboard } from 'Lib';
import { Filter, MenuItemVertical } from 'Component';

const MenuOptionEdit = observer(class MenuOptionEdit extends React.Component<I.Menu> {
	
	node = null;
	refName = null;
	color = '';
	n = -1;

	constructor (props: I.Menu) {
		super(props);

		this.onClear = this.onClear.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { option, isNew } = data;
		const sections = this.getSections();

		const Color = (item: any) => {
			const cn = [ 'item', 'color', `color-${item.className}` ];

			if (this.color == item.value) {
				cn.push('selected');
			};

			return (
				<div
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={e => this.onClick(e, item)}
					onMouseEnter={e => this.onMouseEnter(e, item)}
				/>
			);
		};

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
			<div ref={ref => this.node = ref}>
				<Filter
					ref={ref => this.refName = ref}
					placeholder={isNew ? translate('menuDataviewOptionCreatePlaceholder') : translate('menuDataviewOptionEditPlaceholder')}
					className="outlined"
					value={option.name}
					onKeyUp={(e: any, v: string) => this.onKeyUp(e, v)}
					onClear={this.onClear}
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
		this.checkButton();
	};

	componentWillUnmount () {
		this.unbind();
	};

	focus () {
		window.setTimeout(() => this.refName?.focus(), 15);
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
		const { param } = this.props;
		const { data } = param;
		const { isNew } = data;
		const colors = U.Menu.getBgColors().filter(it => it.id != 'bgColor-default');

		let button = null;
		if (isNew) {
			button = { id: 'create', icon: 'add', name: translate('menuDataviewOptionEditCreate') };
		} else {
			button = { id: 'remove', icon: 'remove', name: translate('menuDataviewOptionEditDelete') };
		};

		return [
			{ children: colors, className: 'colorPicker' },
			{ 
				children: [ button ]
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
		const { param } = this.props;
		const { data } = param;
		const { isNew } = data;

		let ret = false;

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			if (isNew) {
				this.create();
			} else {
				this.save();
				this.props.close();
			};

			ret = true;
		});

		if (!ret) {
			this.props.onKeyDown(e);
		};
	};

	onKeyUp (e: any, v: string) {
		this.checkButton();
	};

	onClick (e: any, item: any) {
		if (item.isBgColor) {
			this.color = item.value;
			this.save();
			this.forceUpdate();
		} else
		if (item.id == 'remove') {
			S.Popup.open('confirm', {
				data: {
					icon: 'confirm',
					title: translate('commonAreYouSure'),
					text: translate('popupConfirmRelationOptionRemoveText'),
					textConfirm: translate('commonDelete'),
					onConfirm: () => {
						this.remove();
					}
				}
			});
		} else
		if (item.id == 'create') {
			this.create();
		};
	};

	onMouseEnter (e: any, item: any) {
		const { getId } = this.props;
		const el = $(`#${getId()} #item-${item.id}`);

		if (el.hasClass('disabled') || keyboard.isMouseDisabled) {
			return;
		};

		this.props.setActive(item, false);
	};

	onClear () {
		$(this.node).find('#item-create').addClass('disabled');
	};

	remove () {
		const { param, close, id } = this.props;
		const { data } = param;
		const { option, onChange } = data;
		const value = Relation.getArrayValue(data.value).filter(it => it != option.id);

		C.RelationListRemoveOption([ option.id ], false);

		S.Menu.updateData(id, { value });
		S.Menu.updateData('dataviewOptionList', { value });

		if (onChange) {
			onChange(value);
		};

		close();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { option, isNew } = data;
		const value = String(this.refName?.getValue() || '');

		if (!value || isNew) {
			return;
		};

		C.ObjectListSetDetails([ option.id ], [
			{ key: 'name', value },
			{ key: 'relationOptionColor', value: this.getColor() },
		]);
	};

	create () {
		const { param, close } = this.props;
		const { data } = param;
		const { relationKey } = data;
		const value = String(this.refName?.getValue() || '');

		if (!value) {
			return;
		};

		if (!relationKey) {
			console.error('[MenuDataviewOption.Create] No relationKey');
			return;
		};

		C.ObjectCreateRelationOption({
			relationKey,
			name: value,
			relationOptionColor: this.getColor(),
		}, S.Common.space);
		close();
	};

	getColor () {
		const colors = U.Menu.getBgColors().filter(it => it.id != 'bgColor-default');

		if (this.n > -1) {
			return colors[this.n]?.value || this.color;
		};
		return this.color;
	};
	
	checkButton () {
		const { param } = this.props;
		const { data } = param;
		const { isNew } = data;

		if (!isNew) {
			return;
		};

		const v = String(this.refName?.getValue() || '').trim();

		$(this.node).find('#item-create').toggleClass('disabled', !v.length);
	};

});

export default MenuOptionEdit;