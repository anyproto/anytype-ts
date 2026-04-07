import React, { forwardRef } from 'react';
import { Icon, ObjectName } from 'Component';
import * as I from 'Interface';

const BlockLoader = forwardRef<{}, I.BlockComponent>((props, ref) => {

	const { rootId, block } = props;
	const { content } = block;
	const { targetObjectId } = content;
	const object = S.Detail.get(rootId, targetObjectId, []);
	const cn = [ 'mediaBlockLoader' ];

	let icon = 'loading';

	if (object.isDeleted || object.isArchived) {
		icon = 'ghost';
		cn.push('deleted');
	};

	return (
		<div className={cn.join(' ')}>
			<Icon className={icon} />
			<ObjectName object={object} />
		</div>
	);

});

export default BlockLoader;