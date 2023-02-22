import * as React from 'react';
import { I, Util } from 'Lib';

interface Props {
	text: string;
	className?: string;
	dataset?: any;
};

class Title extends React.Component<Props> {

	render () {
		const { text, className, dataset } = this.props;
		const cn = [ 'title' ];

		if (className) {
			cn.push(className);
		};

		return (
			<div 
				className={cn.join(' ')} 
				dangerouslySetInnerHTML={{ __html: text }} 
				{...Util.dataProps({ ...dataset, content: text, 'animation-type': I.AnimType.Text })}
			/>
		);
	};
	
};

export default Title;