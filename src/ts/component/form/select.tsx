import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef, MouseEvent } from 'react';
import { Icon, MenuItemVertical } from 'Component';
import * as I from 'Interface';

type SelectSize = 28 | 36;

interface Props {
	id: string;
	initial?: string;
	size?: SelectSize;
	className?: string;
	arrowClassName?: string;
	element?: string;
	value: any;
	options: I.Option[];
	noFilter?: boolean;
	isMultiple?: boolean;
	iconParam?: I.IconParam;
	arrowParam?: Partial<I.IconParam>;
	showOn?: 'click' | 'mouseDown' | 'mouseEnter';
	readonly?: boolean;
	menuParam?: Partial<I.MenuParam>;
	tooltipParam?: I.TooltipParam;
	onChange? (id: any): void;
};

interface SelectRefProps {
	getValue: () => any;
	setValue: (v: any) => void;
	setOptions: (options: I.Option[]) => void;
	show: (e: MouseEvent) => void;
};

const Select = forwardRef<SelectRefProps, Props>(({
	id = '',
	initial = '',
	size = 28,
	className = '',
	arrowClassName = '',
	element = '',
	value: initialValue = [],
	options: initialOptions = [],
	noFilter = true,
	isMultiple = false,
	showOn = 'click',
	readonly = false,
	menuParam = {},
	tooltipParam = {},
	iconParam,
	arrowParam,
	onChange,
}, ref) => {

	const [ value, setValue ] = useState(initialValue);
	const [ options, setOptions ] = useState(initialOptions);
	const nodeRef = useRef(null);
	const cn = [ 'select', `size${size}`, className ];
	const acn = [ 'arrow', arrowClassName ];
	const current: any[] = [];

	if (readonly) {
		cn.push('isReadonly');
	};

	let val = Relation.getArrayValue(value);

	if (val.length) {
		const option = options.find(item => item.id == val[0]);
		if (option) {
			const more = val.length > 1 ? ` +${val.length - 1}` : '';
			current.push({ ...option, name: option.name + more });
		};
	};

	if (!current.length && options.length) {
		current.push(options[0]);
	};

	const getOptions = () => {
		const ret = [];
		
		if (initial) {
			ret.push({ id: '', name: initial, isInitial: true });			
		};
		for (const option of initialOptions) {
			ret.push(option);
		};
		return ret;
	};

	const getValue = (val: any): any => {
		return isMultiple ? val : (val.length ? val[0] : '');
	};

	const setValueHandler = (v: any) => {
		setValue(Relation.getArrayValue(v));
	};
	
	const show = (e: MouseEvent) => {
		e.stopPropagation();

		if (readonly) {
			return;
		};

		const el = element || `#select-${id}`;
		const mp = menuParam || {};

		let onOpen = null;
		let onClose = null;

		if (mp.onOpen) {
			onOpen = mp.onOpen;
			delete(mp.onOpen);
		};
		if (mp.onClose) {
			onClose = mp.onClose;
			delete(mp.onClose);
		};

		const param = Object.assign({ 
			element: el,
			noFlipX: true,
			onOpen: (context: any) => {
				window.setTimeout(() => U.Dom.addClass(U.Dom.select(el), 'isFocused'));

				if (onOpen) {
					onOpen(context);
				};
			},
			onClose: () => { 
				window.setTimeout(() => U.Dom.removeClass(U.Dom.select(el), 'isFocused'));

				if (onClose) {
					onClose();
				};
			},
		}, mp);

		param.data = Object.assign({
			noFilter,
			noClose: true,
			value,
			options,
			onSelect: (e: any, item: any) => {
				if (item.id !== '') {
					if (isMultiple) {
						val = val.includes(item.id) ? val.filter(it => it != item.id) : [ ...val, item.id ];
					} else {
						val = [ item.id ];
					};
				} else {
					val = [];
				};

				setValueHandler(val);

				if (onChange) {
					onChange(getValue(val));
				};

				if (!isMultiple) {
					hide();
				} else {
					S.Menu.updateData('select', { value: val });
				};
			},
		}, mp.data || {});

		S.Menu.closeAll([ 'select' ], () => {
			S.Menu.open('select', param);
		});
	};
	
	const hide = () => {
		S.Menu.close('select');
	};

	let onClick = null;
	let onMouseDown = null;
	let onMouseEnter = null;

	if (showOn == 'mouseDown') {
		onMouseDown = show;
	};

	if (showOn == 'click') {
		onClick = show;
	};

	if (showOn == 'mouseEnter') {
		onMouseEnter = show;
	};

	const onMouseEnterHandler = (e: any) => {
		const { text = '', caption = '' } = tooltipParam;
		const t = Preview.tooltipCaption(text, caption);

		if (t) {
			Preview.tooltipShow({ ...tooltipParam, text: t, element: nodeRef.current });
		};
		
		if (onMouseEnter) {
			onMouseEnter(e);
		};
	};
	
	const onMouseLeaveHandler = (e: any) => {
		Preview.tooltipHide(false);
	};

	useEffect(() => {
		const options = getOptions();
		
		let val = Relation.getArrayValue(initialValue);
		if (!val.length && options.length) {
			val = [ options[0].id ];
		};

		setValue(val);
		setOptions(options);
	}, []);

	useImperativeHandle(ref, () => ({
		getValue: () => getValue(val),
		setValue: setValueHandler,
		setOptions: (options: I.Option[]) => setOptions(options),
		show,
	}));

	return (
		<div 
			ref={nodeRef}
			id={`select-${id}`} 
			className={cn.join(' ')} 
			onClick={onClick} 
			onMouseDown={onMouseDown}
			onMouseEnter={onMouseEnterHandler}
			onMouseLeave={onMouseLeaveHandler}
		>
			{current ? (
				<>
					<div className="currentSelected">
						{iconParam ? <Icon {...iconParam} /> : ''}
						{current.map((item: any, i: number) => (
							<MenuItemVertical key={i} {...item} />
						))}
					</div>
					<Icon name="arrow/select" className={acn.join(' ')} {...arrowParam} />
				</>
			) : ''}
		</div>
	);
});

export default Select;
