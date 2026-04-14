import React, { forwardRef } from 'react';
import Icon from 'Component/util/icon';
import IconObject from 'Component/util/iconObject';
import ObjectName from 'Component/util/object/name';
import * as I from 'Interface';

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
	onContext?: (e: any, item: any) => void;
};

const CellItemObject = forwardRef<{}, Props>((props, ref: any) => {

	const { cellId, size, iconSize, relation, canEdit, elementMapper, onClick, onRemove, onContext, getObject } = props;
	const cn = [ 'element' ];

	const onClickHandler = (e: any) => {
		onClick?.(e, getObjectHandler());
	};

	const onContextHandler = (e: any) => {
		onContext?.(e, getObjectHandler());
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
		iconRemove = <Icon name="object/remove" size={8} className="remove" onClick={onRemoveHandler} />;
	};

	if (relation.relationKey != 'type') {
		iconObject = (
			<IconObject 
				id={`${cellId}-icon`}
				object={object} 
				size={size} 
				iconSize={iconSize}
				noClick={true}
				canEdit={!isReadonly && !isArchived && allowedDetails && U.Object.isTaskLayout(layout)} 
			/>
		);
	};

	return (
		<div className={cn.join(' ')} onContextMenu={onContext ? onContextHandler : undefined}>
			<div className="flex">
				{iconObject}
				<ObjectName object={object} onClick={onClickHandler} />
				{iconRemove}
			</div>
		</div>
	);

});

export default CellItemObject;
