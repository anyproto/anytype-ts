import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { IconObject } from 'Component';
import { I, S } from 'Lib';

const BlockIconPage = observer(forwardRef<{}, I.BlockComponent>(({
	rootId = '',
	readonly = false,
}, ref) => {
		
	const object = S.Detail.get(rootId, rootId, []);
	const size = object.iconImage ? 96 : 80;

	return (
		<IconObject 
			id={`block-icon-${rootId}`} 
			canEdit={!readonly} 
			object={object} 
			size={size}
			iconSize={size} 
			menuParam={{ classNameWrap: 'fromBlock' }}
		/>
	);

}));

export default BlockIconPage;