import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.BlockDb {};

class BlockDb extends React.Component<Props, {}> {

	render () {
		const { views, data, properties } = this.props;
		
		const View = (item: any) => (
			<div className="item">
				{item.name}
			</div>
		);
		
		const Row = (item: any) => (
			<div className="row">
			</div>
		);
		
		return (
			<div className="blockDb">
				<div className="views">
					{views.map((item: I.View, i: number) => (
						<View key={i} {...item} />
					))}
					<div className="item">
						<Icon className="plus dark" />
					</div>
				</div>
				
				<div className="buttons">
				</div>
				
				<div className="data">
					{data.map((item: any, i: number) => (
						<Row key={i} {...item} />
					))}
				</div>
			</div>
		);
	};
	
};

export default BlockDb;