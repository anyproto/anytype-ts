import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, Icon } from 'Component';
import { I, S, U } from 'Lib';

interface Props {
	cellId: string;
	size?: number;
	iconSize?: number;
	relation?: any;
	canEdit?: boolean;
	getObject: () => any;
	elementMapper?: (relation: any, item: any) => any;
	onClick?: (e: any, item: any) => void;
	onRemove?: (e: any, id: string) => void;
};

const CellItemObject = observer(forwardRef<{}, Props>((props, ref: any) => {

	const { cellId, size, iconSize, relation, canEdit, elementMapper, onClick, onRemove, getObject } = props;
	const cn = [ 'element' ];
	
	const onClickHandler = (e: any) => {
		if (onClick) {
			onClick(e, getObjectHandler());
		};
	};

	const onRemoveHandler = (e: any) => {
		e.stopPropagation();

		if (canEdit && onRemove) {
			onRemove(e, getObjectHandler().id);
		};
	};

	const getObjectHandler = () => {
		const object = getObject();
		return elementMapper ? elementMapper(relation, object) : object;
	};

	const object = getObject();
	const { done, isReadonly, isArchived, layout } = object;
	const allowedDetails = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);

	let iconObject = null;
	let iconRemove = null;
	
	if (object.isHidden) {
		cn.push('isHidden');
	};
	if (canEdit) {
		cn.push('canEdit');
		iconRemove = <Icon className="objectRemove" onClick={onRemoveHandler} />;
	};
	if (relation.relationKey != 'type') {
		iconObject = (
			<IconObject 
				id={`${cellId}-icon`}
				object={object} 
				size={size} 
				iconSize={iconSize}
				canEdit={!isReadonly && !isArchived && allowedDetails && U.Object.isTaskLayout(layout)} 
			/>
		);
	};

	return (
		<div className={cn.join(' ')}>
			<div className="flex">
				{iconObject}
				<ObjectName object={object} onClick={onClickHandler} />
				{iconRemove}
			</div>
		</div>
	);

}));

export default CellItemObject;