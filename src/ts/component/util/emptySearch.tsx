import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { UtilCommon } from 'Lib';

interface Props {
	text: string;
	style?: any;
};

class EmptySearch extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	render () {
		const { text, style } = this.props;
		
		return (
			<div ref={node => this.node = node} style={style} className="emptySearch">
				<div className="txt" dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(text) }} />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	resize () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};

			const node = $(this.node);
			node.css({ lineHeight: node.height() + 'px' });
		});
	};

};

export default EmptySearch;
