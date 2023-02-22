import * as React from 'react';
import { I, Util } from 'Lib';

interface Props {
	text: string;
	className?: string;
	dataset?: any;
};

class Error extends React.Component<Props> {

	public static defaultProps = {
		text: '',
		className: '',
	};

	render () {
		const { text, className, dataset } = this.props;
		const cn = [ 'error' ];

		if (!text) {
			return null;
		};

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

export default Error;