import React, { forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, ObjectDescription, ObjectType } from 'Component';
import { I, U, S } from 'Lib';

interface Props {
	item: any;
	style?: any;
	onClick?: (item: any) => void;
	onContext?: (item: any) => void;
	onMouseEnter?: (item: any) => void;
	onMouseLeave?: (item: any) => void;
};

const NavigationItem = observer(forwardRef<{}, Props>((props, ref) => {
	
	const { item, style, onClick, onContext, onMouseEnter, onMouseLeave } = props;
	const cn = [ 'item', U.Data.layoutClass(item.id, item.layout) ];
	const type = S.Record.getTypeById(item.type);
	const isFile = U.Object.isInFileLayouts(item.layout);
	const canEdit = U.Object.isTaskLayout(item.layout) && S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]);
	const nodeRef = useRef(null);
	const icon = <IconObject object={item} size={48} iconSize={isFile ? 48 : null} canEdit={canEdit} />;

	let description = null;
	if (isFile) {
		cn.push('isFile');
		description = <div className="descr">{U.File.size(item.sizeInBytes)}</div>;
	} else {
		description = <ObjectDescription object={item} />;
	};

	useEffect(() => {
		const node = $(nodeRef.current);

		node.toggleClass('withIcon', !!node.find('.iconObject').length);
		node.toggleClass('withDescr', !!node.find('.descr').length);
	});

	return (
		<div 
			ref={nodeRef}
			id={`item-${item.id}`}
			className={cn.join(' ')} 
			style={style}
			onClick={onClick}
			onContextMenu={onContext}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{icon}
			<div className="info">
				<div className="nameWrap">
					<ObjectName object={item} withPlural={true} />
				</div>
				<div className="bottomWrap">
					<div className="type">
						<ObjectType object={type} />
					</div>
					<div className="bullet" />
					{description}
				</div>
			</div>
		</div>
	);

}));

export default NavigationItem;