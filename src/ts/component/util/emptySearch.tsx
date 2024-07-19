import * as React from 'react';
import { U, translate } from 'Lib';

interface Props {
	text?: string;
	filter?: string;
	readonly?: boolean;
	style?: any;
};

class EmptySearch extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	render () {
		const { readonly, filter, style } = this.props;

		let text = this.props.text;
		if (!text) {
			if (filter) {
				text = U.Common.sprintf(translate(readonly ? 'popupSearchEmptyFilterReadonly' : 'popupSearchEmptyFilter'), filter);
			} else {
				text = translate('popupSearchEmpty');
			};
		};
		
		return (
			<div ref={node => this.node = node} style={style} className="emptySearch">
				<div className="txt" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }} />
			</div>
		);
	};
	
};

export default EmptySearch;
