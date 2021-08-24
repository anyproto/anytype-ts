import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { InlineMath, BlockMath } from 'react-katex';

import 'katex/dist/katex.min.css';

interface Props extends I.BlockComponent {}

const BlockLatex = observer(class BlockLatex extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
	};

	render () {
		const { rootId, block, readonly } = this.props;



		return (
			<div>
				<BlockMath math={'\\int_0^\\infty x^2 dx'} errorColor={'#cc0000'} />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
});

export default BlockLatex;