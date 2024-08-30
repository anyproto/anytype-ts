import * as React from 'react';
import { I, U } from 'Lib';
import $ from 'jquery';

interface Props {
	text: string;
	className?: string;
	dataset?: any;
};

class Title extends React.Component<Props> {

	node: any = null;

	render () {
		const { text, className, dataset } = this.props;
		const cn = [ 'title' ];

		if (className) {
			cn.push(className);
		};

		return (
			<div
				ref={node => this.node = node}
				className={cn.join(' ')} 
				dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }} 
				{...U.Common.dataProps({ ...dataset, content: text, 'animation-type': I.AnimType.Text })}
			/>
		);
	};

	componentDidMount () {
		U.Common.renderLinks($(this.node));
	};
	
};

export default Title;
