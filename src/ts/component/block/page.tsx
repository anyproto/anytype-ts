import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Smile } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Block {
	blockStore?: any;
};

@inject('blockStore')
@observer
class BlockPage extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};

	render() {
		const { blockStore, id } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.id == id; });
		
		if (!block) {
			return null;
		};
		
		const { fields } = block;
		const { icon, name } = fields;
		
		return (
			<div>
				<Smile id={'block-page-' + id} icon={icon} canEdit={true} />
				<div className="name">
					{name}
				</div>
			</div>
		);
	};
	
};

export default BlockPage;