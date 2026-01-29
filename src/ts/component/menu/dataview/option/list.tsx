import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, keyboard, Relation } from 'Lib';
import OptionSelect, { OptionSelectRefProps } from 'Component/util/menu/optionSelect';

const SUB_ID = 'dataviewOptionList';

const MenuOptionList = observer(forwardRef<{}, I.Menu>((props, ref) => {

	const { id, param, close, position, setActive, getId, onKeyDown, getSize } = props;
	const { data, className, classNameWrap } = param;
	const { canAdd, canEdit, noFilter, cellRef, noSelect, onChange, maxCount, filterMapper, skipIds } = data;
	const relation = data.relation.get();
	const value = Relation.getArrayValue(data.value);
	const optionSelectRef = useRef<OptionSelectRefProps>(null);
	const n = useRef(-1);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDownHandler(e));
		$(`#${getId()}`).on('click', () => S.Menu.close('dataviewOptionEdit'));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
		$(`#${getId()}`).off('click');
	};

	const onKeyDownHandler = (e: any) => {
		if (keyboard.isComposition) {
			return;
		};

		const items = optionSelectRef.current?.getItems() || [];
		const currentIndex = optionSelectRef.current?.getIndex() ?? -1;

		let ret = false;

		keyboard.shortcut('arrowright', e, () => {
			const item = items[currentIndex];
			if (item && item.id != 'add') {
				optionSelectRef.current?.onOver(e, item);
			};
			ret = true;
		});

		if (!ret) {
			onKeyDown(e);
		};
	};

	const onValueChange = (newValue: string[]) => {
		S.Menu.updateData(id, { value: newValue });
		onChange?.(newValue);
	};

	const onMenuClose = () => {
		close();
	};

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
	}, []);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems: () => optionSelectRef.current?.getItems() || [],
		getIndex: () => optionSelectRef.current?.getIndex() ?? n.current,
		setIndex: (i: number) => {
			n.current = i;
			optionSelectRef.current?.setIndex(i);
		},
		getFilterRef: () => optionSelectRef.current?.getFilterRef(),
		getListRef: () => optionSelectRef.current?.getListRef(),
		onClick: (e: any, item: any) => optionSelectRef.current?.onClick(e, item),
		onSortEnd: (result: any) => optionSelectRef.current?.onSortEnd?.(result),
	}), []);

	return (
		<OptionSelect
			ref={optionSelectRef}
			subId={SUB_ID}
			relationKey={relation.relationKey}
			value={value}
			onChange={onValueChange}
			isReadonly={!canEdit}
			noFilter={noFilter}
			noSelect={noSelect}
			maxCount={maxCount}
			skipIds={skipIds}
			filterMapper={filterMapper}
			canAdd={canAdd}
			canSort={canEdit}
			canEdit={canEdit}
			setActive={setActive}
			onClose={onMenuClose}
			menuId={getId()}
			menuClassName={className}
			menuClassNameWrap={classNameWrap}
			getSize={getSize}
			position={position}
			cellRef={cellRef}
			rebind={rebind}
		/>
	);

}));

export default MenuOptionList;
