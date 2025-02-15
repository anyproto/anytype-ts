import React, { forwardRef, useState, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, S, Relation } from 'Lib';

const CellFile = observer(forwardRef<I.CellRef, I.Cell>((props, ref) => {

	const [ isEditing, setIsEditing ] = useState(false);
	const { id, subId, relation, recordId, size, iconSize, placeholder, arrayLimit, canEdit, getRecord, elementMapper } = props;
	const record = getRecord(recordId) || {};
	
	let value: any[] = Relation.getArrayValue(record[relation.relationKey]);
	value = value.map(it => S.Detail.get(subId, it, []));
	value = value.filter(it => !it._empty_ && !it.isArchived && !it.isDeleted);
	
	if (elementMapper) {
		value = value.map(it => elementMapper(relation, it));
	};

	const cn = [ 'wrap' ];
	const length = value.length;

	if (arrayLimit) {
		value = value.slice(0, arrayLimit);
		if (length > arrayLimit) {
			cn.push('overLimit');
		};
	};

	const Item = (item: any) => (
		<div className="element" onClick={e => onClick(e, item)}>
			<div className="flex">
				<IconObject object={item} size={size} iconSize={iconSize} />
				<ObjectName object={item} />
			</div>
		</div>
	);

	const setEditing = (v: boolean) => {
		if (canEdit && (v != isEditing)) {
			setIsEditing(v);
		};
	};

	const onClick = (e: any, item: any) => {
	};

	useEffect(() => {
		$(`#${id}`).toggleClass('isEditing', isEditing);
	}, [ isEditing ]);

	useImperativeHandle(ref, () => ({
		setEditing,
		isEditing: () => isEditing,
		getValue: () => value,
	}));

	return (
		<div className={cn.join(' ')}>
			{value.length ? (
				<span className="over">
					{value.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
					{arrayLimit && (length > arrayLimit) ? <div className="more">+{length - arrayLimit}</div> : ''}
				</span>
			) : (
				<div className="empty">{placeholder}</div>
			)}
		</div>
	);

}));

export default CellFile;