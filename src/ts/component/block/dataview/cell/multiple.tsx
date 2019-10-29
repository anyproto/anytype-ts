import * as React from 'react';
import { Tag } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.Cell {};

class CellMultiple extends React.Component<Props, {}> {

	render () {
		let { data } = this.props;
		
		data = data || [];
		
		return (
			<React.Fragment>
				{data.map((text: string, i: number) => (
					<Tag key={i} text={text} />					
				))}
			</React.Fragment>
		);
	};
	
};

export default CellMultiple;