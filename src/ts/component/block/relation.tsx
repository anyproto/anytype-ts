import * as React from 'react';
import { Icon, Label } from 'ts/component';
import { I, DataUtil, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';

interface Props extends I.BlockComponent {};

@observer
class BlockRelation extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
	};

	render (): any {
		const { rootId, block, readOnly } = this.props;
		const { content } = block;
		const { key } = content;
		const details = blockStore.getDetails(rootId, rootId);

		return (
			<div className="wrap">
				{!key ? 
				(
					<React.Fragment>
						<Icon className="relation" />
						<Label text="New relation" />
					</React.Fragment>
				) : 
				''}
			</div>
		);
	};

};

export default BlockRelation;