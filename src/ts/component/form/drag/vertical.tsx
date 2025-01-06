import React, { useRef, useImperativeHandle, forwardRef, ChangeEvent, MouseEvent, useEffect } from 'react';
import $ from 'jquery';
import { Input } from 'Component';

interface Props {
	id?: string;
	className?: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	onChange? (e: ChangeEvent<HTMLInputElement>, v: number): void;
	onMouseLeave? (e: MouseEvent): void;
	onMouseEnter? (e: MouseEvent): void;
};

interface DragVerticalRefProps {
	getValue: () => number;
	setValue: (v: number) => void;
};

const DragVertical = forwardRef<DragVerticalRefProps, Props>(({
	id,
	className = '',
	value: initialValue = 0,
	min = 0,
	max = 1,
	step = 0.01,
	onChange,
	onMouseLeave,
	onMouseEnter,
}, ref) => {
	const inputRef = useRef(null);
	const trackRef = useRef(null);
	const divRef = useRef(null);

	const setHeight = (v: number) => {
		$(trackRef.current).css({ height: `${Math.round(v * 72)}px` });
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>, value: string) => {
		const v = 1 - Number(value) || 0;

		e.preventDefault();
		e.stopPropagation();

		setHeight(v);

		if (onChange) {
			onChange(e, v);
		};
	};

	useImperativeHandle(ref, () => ({
		getValue: () => inputRef.current?.getValue(),
		setValue: (v: number) => inputRef.current?.setValue(v),
	}));

	useEffect(() => {
		setHeight(initialValue);
		inputRef.current.setValue(initialValue);
	}, []);

	return (
		<div 
			id={id}
			ref={divRef}
			className={`input-drag-vertical ${className}`}
			onMouseLeave={onMouseLeave}
			onMouseEnter={onMouseEnter}
		>
			<Input
				type="range"
				className="vertical-range"
				ref={inputRef}
				value={String(initialValue)}
				min={min}
				max={max}
				step={step}
				onChange={handleChange}
				onClick={e => {
					e.preventDefault();
					e.stopPropagation();
				}}
			/>
			<div className="slider-bg" />
			<div 
				ref={trackRef} 
				className="slider-track" 
			/>
		</div>
	);
});

export default DragVertical;