import React, { forwardRef, useImperativeHandle } from 'react';
import { Icon, Label } from 'Component';
import * as I from 'Interface';

const CellCheckbox = forwardRef<I.CellRef, I.Cell>((props, ref) => {

	const { 
		withLabel = false, 
		withName = '', 
		relation = {}, 
		recordId = '', 
		getRecord, 
		onChange,
		viewType,
	} = props;
	const record = getRecord(recordId) || {};
	const value = Boolean(record[relation.relationKey]);
	const cn = [];

	if (value) {
		cn.push('active');
	};
	
	const onClick = () => {
		onChange(!value);
	};

	let label = '';
	if (withLabel) {
		label = U.String.sprintf(translate(`relationCheckboxLabel${Number(value)}`), relation.name);
	} else
	if (withName) {
		label = relation.name;
	};

	useImperativeHandle(ref, () => ({
		onClick,
		getValue: () => value,
	}));

	return (
		<>
			<Icon 
				name={value ? 'marker/checkbox2' : 'marker/checkbox0'} 
				color={value ? 'accent100' : ''} 
				size={viewType == I.ViewType.Grid ? 20 : 16} 
			/>
			{label ? <Label text={label} /> : ''}
		</>
	);

});

export default CellCheckbox;