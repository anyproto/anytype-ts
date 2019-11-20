import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Smile } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Block {
	blockStore?: any;
	history?: any;
	rootId: string;
};

@inject('blockStore')
@observer
class BlockPage extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render() {
		const { blockStore, id, rootId } = this.props;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((item: I.Block) => { return item.id == id; });
		
		if (!block) {
			return null;
		};
		
		const { fields } = block;
		const { icon, name } = fields;
		
		return (
			<React.Fragment>
				<Smile id={'block-page-' + id} offsetX={28} offsetY={-24} icon={icon} canEdit={true} />
				<div className="name" onClick={this.onClick}>
					{name}
				</div>
			</React.Fragment>
		);
	};
	
	onClick () {
		const { id } = this.props;
		this.props.history.push('/main/edit/' + id);
	};
	
};

export default BlockPage;