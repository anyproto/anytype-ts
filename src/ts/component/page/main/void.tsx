import * as React from 'react';
import { observer } from 'mobx-react';
import { Title } from 'Component';
import { I } from 'Lib';

const PageMainVoid = observer(class PageMainVoid extends React.Component<I.PageComponent> {

	node = null;

	render () {
		return (
			<div 
				ref={node => this.node = node}
				className="wrapper"
			>
				<Title text="THIS IS VOID!" />
			</div>
		);
	};
	
});

export default PageMainVoid;