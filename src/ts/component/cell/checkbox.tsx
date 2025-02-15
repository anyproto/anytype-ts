import React, { forwardRef, useImperativeHandle } from 'react';
import { Icon, Label } from 'Component';
import { I, U, translate } from 'Lib';
import { observer } from 'mobx-react';

const CellCheckbox = observer(forwardRef<I.CellRef, I.Cell>((props, ref) => {

	const { 
		withLabel = false, 
		withName = '', 
		relation = {}, 
		recordId = '', 
		getRecord, 
		onChange,
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
		label = U.Common.sprintf(translate(`relationCheckboxLabel${Number(value)}`), relation.name);
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
			<Icon className={cn.join(' ')} />
			{label ? <Label text={label} /> : ''}
		</>
	);

}));

export default CellCheckbox;