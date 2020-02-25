import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

@observer
class MenuBlockCover extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};

	render () {
		const sections = this.getSections();
		
		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="items">
					{item.children.map((action: any, i: number) => {
						return <Item key={i} {...action} />;
					})}
				</div>
			</div>
		);
		
		const Item = (item: any) => (
			<div className={[ 'item', 'c' + item.type, item.value ].join(' ')} />
		);
		
		return (
			<div>
				<div className="head">
					<div className="btn">Upload image</div>
					<div className="btn">Reposition</div>
					<div className="btn">Remove</div>
				</div>
				<div className="sections">
					{sections.map((section: any, i: number) => {
						return <Section key={i} {...section} />;
					})}
				</div>
			</div>
		);
	};
	
	getSections () {
		return [
			{ name: 'Solid colors', children: [
				{ type: 0, value: 'yellow' },
				{ type: 0, value: 'orange' },
				{ type: 0, value: 'red' },
				{ type: 0, value: 'pink' },
				{ type: 0, value: 'purple' },
				{ type: 0, value: 'blue' },
				{ type: 0, value: 'ice' },
				{ type: 0, value: 'teal' },
				{ type: 0, value: 'green' },
				{ type: 0, value: 'lightgrey' },
				{ type: 0, value: 'darkgrey' },
				{ type: 0, value: 'black' },
			] as any[] },
			
			{ name: 'Gradients', children: [
				{ type: 1, value: 'yellow' },
				{ type: 1, value: 'red' },
				{ type: 1, value: 'blue' },
				{ type: 1, value: 'teal' },
			] as any[] }
		];
	};
	
};

export default MenuBlockCover;