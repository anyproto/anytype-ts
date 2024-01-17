import * as React from 'react';
import { I, UtilCommon } from 'Lib';

interface Props {
	id?: string;
	text?: string;
	className?: string;
	dataset?: any;
};

class Error extends React.Component<Props> {

	public static defaultProps = {
		text: '',
		className: '',
	};

	render () {
		const { id, text, className, dataset } = this.props;
		const cn = [ 'error' ];

		if (!text && !id) {
			return null;
		};

		if (className) {
			cn.push(className);
		};
		
		return (
			<div 
				id={id}
				className={cn.join(' ')}
				dangerouslySetInnerHTML={{ __html: UtilCommon.sanitize(text) }} 
				{...UtilCommon.dataProps({ ...dataset, content: text, 'animation-type': I.AnimType.Text })}
			/>
		);
	};
	
};

export default Error;