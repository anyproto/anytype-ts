import * as React from 'react';
import { UtilCommon, translate } from 'Lib';

interface Props {
	object: any;
};

class Type extends React.Component<Props> {

	render () {
		const object = this.props.object || {};
		
		return !object._empty_ && !object.isDeleted ? UtilCommon.shorten(object.name, 32) : (
			<span className="textColor-red">
				{translate('commonDeletedType')}
			</span>
		);
	};
	
};

export default Type;