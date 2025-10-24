import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';
import { PreviewObject } from 'Component';

const MenuPreviewObject = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param } = props;
	const { data } = param;
	const { rootId } = data;

	return (
		<PreviewObject size={I.PreviewSize.Small} rootId={rootId} />
	);

}));

export default MenuPreviewObject;