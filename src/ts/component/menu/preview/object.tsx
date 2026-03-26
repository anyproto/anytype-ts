import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { PreviewObject } from 'Component';
import * as I from 'Interface';

const MenuPreviewObject = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param } = props;
	const { data } = param;
	const { rootId } = data;

	return (
		<PreviewObject size={I.PreviewSize.Small} rootId={rootId} />
	);

}));

export default MenuPreviewObject;