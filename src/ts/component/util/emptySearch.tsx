import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';

interface Props {
	text: string;
};

class EmptySearch extends React.Component<Props> {

	_isMounted: boolean = false;
	node: any = null;

	render () {
		const { text } = this.props;
		
		return (
			<div 
				ref={node => this.node = node}
				className="emptySearch"
			>
				<div className="txt" dangerouslySetInnerHTML={{ __html: text }} />
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