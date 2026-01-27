import React, { forwardRef, useEffect, useRef, useImperativeHandle, useState } from 'react';
import { observer } from 'mobx-react';
import { IconObject, Editable, Label } from 'Component';
import { J, analytics, I, keyboard, translate } from 'Lib';
import { range, set } from 'lodash';

const SidebarSectionTypeTitle = observer(forwardRef<I.SidebarSectionRef, I.SidebarSectionComponent>((props, ref) => {
	
	const { id, object, readonly, disableButton, onChange } = props;
	const nameRef = useRef(null);
	const timeoutRef = useRef(0);
	const valueRef = useRef('');
	const [ dummy, setDummy ] = useState(0);
	const rangeRef = useRef<I.TextRange>(null);

	const getRelationKey = (): string => {
		switch (id) {
			case 'title': return 'name';
			case 'plural': return 'pluralName';
		};
		return '';
	};

	const setValue = () => {
		let text = String(object[getRelationKey()] || '');
		if (text == translate('defaultNameType')) {
			text = '';
		};

		nameRef.current?.setValue(text);
		nameRef.current?.placeholderCheck();
		valueRef.current = text;

		if (!rangeRef.current && (id == 'title')) {
			const l = text.length;

			rangeRef.current = { from: l, to: l };
		};

		if (rangeRef.current) {
			nameRef.current?.setRange(rangeRef.current);
		};
	};

	const onIconSelect = (id: string, color: number) => {
		onChange({ iconName: id, iconOption: color, iconImage: '' });

		analytics.stackAdd('SetIcon', { objectType: J.Constant.typeKey.type, color });
	};

	const onImageSelect = (id: string) => {
		onChange({ iconName: '', iconOption: 0, iconImage: id });
	};

	const onChangeHandler = () => {
		const value = getValue();

		if (value != valueRef.current) {
			valueRef.current = value;
			disableButton(!value);
			onChange({ [getRelationKey()]: value });
		};

		window.clearTimeout(timeoutRef.current);
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			onChangeHandler();
		});
	};

	const onSelect = () => {
		rangeRef.current = nameRef.current?.getRange() || null;
	};

	const onBlur = () => {
		onChangeHandler();
	};

	const getValue = () => {
		let t = String(nameRef.current.getTextValue() || '');
		if (t === '\n') {
			t = '';
		};
		return t;
	};

	const onKeyUp = (e: any) => {
		window.clearTimeout(timeoutRef.current);
		timeoutRef.current = window.setTimeout(() => onChangeHandler(), J.Constant.delay.keyboard);
	};

	let icon = null;
	let label = '';
	let placeholder = '';

	switch (id) {
		case 'title': {
			label = translate('sidebarTypeTitleLabelName');
			placeholder = translate('sidebarTypeTitlePlaceholder');
			icon = (
				<IconObject 
					id="sidebar-icon-title" 
					object={object} 
					size={24} 
					canEdit={!readonly}
					onIconSelect={onIconSelect}
					onUpload={onImageSelect}
					menuParam={{
						horizontal: I.MenuDirection.Center,
						className: 'fixed',
						classNameWrap: 'fromSidebar',
					}}
				/>
			);
			break;
		};

		case 'plural': {
			label = translate('sidebarTypeTitleLabelPlural');
			placeholder = translate('sidebarTypeTitlePlaceholderPlural');
			break;
		};

	};

	useEffect(() => {
		setValue();

		return () => {
			window.clearTimeout(timeoutRef.current);	
		};
	}, []);

	useEffect(() => {
		setValue();
	});

	useEffect(() => {
		rangeRef.current = null;
		setValue();
	}, [ object ]);

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
	}));

	return (
		<div className="wrap">
			<Label text={label} />

			<div className="flex">
				{icon}
				<Editable
					ref={nameRef}
					readonly={readonly}
					onBlur={onBlur}
					onKeyDown={onKeyDown}
					onKeyUp={onKeyUp}
					onSelect={onSelect}
					placeholder={placeholder}
				/>
			</div>
		</div>
	);

}));

export default SidebarSectionTypeTitle;