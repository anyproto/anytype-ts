import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject } from 'Component';
import { I, S } from 'Lib';

const BlockIconPage = observer(class BlockIconPage extends React.Component<I.BlockComponent> {

	render (): any {
		const { rootId, readonly } = this.props;
		
		return (
			<IconObject 
				id={`block-icon-${rootId}`} 
				canEdit={!readonly} 
				getObject={() => S.Detail.get(rootId, rootId, [])} 
				size={96} 
			/>
		);
	};

});

export default BlockIconPage;