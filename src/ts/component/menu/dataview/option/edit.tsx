import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, C, U, Relation, translate, keyboard } from 'Lib';
import { Filter, MenuItemVertical } from 'Component';

const MenuOptionEdit = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { id, param, getId, close, setActive, onKeyDown } = props;
	const { data } = param;
	const { option, isNew, onChange, relationKey } = data;
	const [ dummy, setDummy ] = useState(0);
	const nodeRef = useRef(null);
	const nameRef = useRef(null);
	const colorRef = useRef('');
	const n = useRef(-1);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDownHandler(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getSections = () => {
		const colors = U.Menu.getBgColors().filter(it => it.id != 'bgColor-default');

		let button = null;
		if (isNew) {
			button = { id: 'create', icon: 'add', name: translate('menuDataviewOptionEditCreate') };
		} else {
			button = { id: 'remove', icon: 'remove', name: translate('menuDataviewOptionEditDelete') };
		};

		return [
			{ children: colors, className: 'colorPicker' },
			{ children: [ button ] },
		];
	};

	const getItems = () => {
		const sections = getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	const onKeyDownHandler = (e: any) => {
		let ret = false;

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			if (isNew) {
				create();
			} else {
				save();
				close();
			};

			ret = true;
		});

		if (!ret) {
			onKeyDown(e);
		};
	};

	const onKeyUp = (e: any, v: string) => {
		checkButton();
	};

	const onClick = (e: any, item: any) => {
		if (item.isBgColor) {
			colorRef.current = item.value;
			save();
			setDummy(dummy + 1);
		} else
		if (item.id == 'remove') {
			S.Popup.open('confirm', {
				data: {
					icon: 'confirm',
					title: translate('commonAreYouSure'),
					text: translate('popupConfirmRelationOptionRemoveText'),
					textConfirm: translate('commonDelete'),
					onConfirm: remove,
				},
			});
		} else
		if (item.id == 'create') {
			create();
		};
	};

	const onMouseEnter = (e: any, item: any) => {
		const el = $(`#${getId()} #item-${item.id}`);

		if (el.hasClass('disabled') || keyboard.isMouseDisabled) {
			return;
		};

		setActive(item, false);
	};

	const onClear = () => {
		$(nodeRef.current).find('#item-create').addClass('disabled');
	};

	const remove = () => {
		const value = Relation.getArrayValue(data.value).filter(it => it != option.id);

		C.RelationListRemoveOption([ option.id ], false);

		S.Menu.updateData(id, { value });
		S.Menu.updateData('dataviewOptionList', { value });

		onChange?.(value);
		close();
	};

	const save = () => {
		const value = String(nameRef.current?.getValue() || '');

		if (!value || isNew) {
			return;
		};

		C.ObjectListSetDetails([ option.id ], [
			{ key: 'name', value },
			{ key: 'relationOptionColor', value: getColor() },
		]);
	};

	const create = () => {
		const value = String(nameRef.current?.getValue() || '');

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
			relationOptionColor: getColor(),
		}, S.Common.space);

		close();
	};

	const getColor = () => {
		return colorRef.current;
	};
	
	const checkButton = () => {
		if (!isNew) {
			return;
		};

		const v = String(nameRef.current?.getValue() || '').trim();

		$(nodeRef.current).find('#item-create').toggleClass('disabled', !v.length);
	};

	const Color = (item: any) => {
		const cn = [ 'item', 'color', `color-${item.className}` ];

		if (colorRef.current == item.value) {
			cn.push('selected');
		};

		return (
			<div
				id={`item-${item.id}`}
				className={cn.join(' ')}
				onClick={e => onClick(e, item)}
				onMouseEnter={e => onMouseEnter(e, item)}
			/>
		);
	};

	const Section = (item: any) => (
		<div className={[ 'section', (item.className ? item.className : '') ].join(' ')}>
			<div className="items">
				{item.children.map((action: any, i: number) => {
					if (action.isBgColor) {
						return <Color key={i} {...action} />;
					} else {
						return (
							<MenuItemVertical 
								key={i} 
								{...action} 
								onClick={e => onClick(e, action)}
								onMouseEnter={e => onMouseEnter(e, action)}
							/>
						);
					};
				})}
			</div>
		</div>
	);

	const sections = getSections();

	useEffect(() => {
		colorRef.current = option.color;

		rebind();
		setDummy(dummy + 1);

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		setActive();
		checkButton();
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
	}), []);

	return (
		<div ref={nodeRef}>
			<Filter
				ref={nameRef}
				placeholder={isNew ? translate('menuDataviewOptionCreatePlaceholder') : translate('menuDataviewOptionEditPlaceholder')}
				className="outlined"
				value={option.name}
				onKeyUp={(e: any, v: string) => onKeyUp(e, v)}
				onClear={onClear}
				focusOnMount={true}
			/>

			{sections.map((item: any, i: number) => (
				<Section key={i} {...item} />
			))}
		</div>
	);

}));

export default MenuOptionEdit;