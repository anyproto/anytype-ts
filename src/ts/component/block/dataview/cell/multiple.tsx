import * as React from 'react';
import { Tag } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.Cell {};

class CellMultiple extends React.Component<Props, {}> {

	render () {
		let { data, relation } = this.props;
		
		return (
			<React.Fragment>
				{(data[relation.id] || []).map((text: string, i: number) => (
					<Tag key={i} text={text} />					
				))}
			</React.Fragment>
		);
	};
	
};

export default CellMultiple;