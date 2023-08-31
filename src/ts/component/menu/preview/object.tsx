import * as React from 'react';
import { I } from 'Lib';
import { PreviewObject } from 'Component';

class MenuPreviewObject extends React.Component<I.Menu> {

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		return (
			<PreviewObject key={'objectPreview-' + rootId} size={I.PreviewSize.Small} rootId={rootId} />
		);
	};

};

export default MenuPreviewObject;
