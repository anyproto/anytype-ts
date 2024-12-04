import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { IconObject } from 'Component';
import { I, S } from 'Lib';

const BlockIconPage = observer(forwardRef<{}, I.BlockComponent>(({
	rootId = '',
	readonly = false,
}, ref) => {
		
	return (
		<IconObject 
			id={`block-icon-${rootId}`} 
			canEdit={!readonly} 
			getObject={() => S.Detail.get(rootId, rootId, [])} 
			size={96} 
		/>
	);

}));

export default BlockIconPage;