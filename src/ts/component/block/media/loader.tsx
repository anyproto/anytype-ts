import React, { forwardRef } from 'react';
import { Icon, Label } from 'Component';
import { I, S, translate } from 'Lib';
import { observer } from 'mobx-react';

const BlockLoader = observer(forwardRef<{}, I.BlockComponent>((props, ref) => {

	const { rootId, block } = props;
	const { content } = block;
	const { state, targetObjectId, type } = content;
	const object = S.Detail.get(rootId, targetObjectId, []);
	const { name, fileExt, isDeleted } = object;
	const isError = state == I.FileState.Error;
	const cn = [ 'mediaBlockLoader' ];

	let icon = 'loading';
	let label = '';

	if (name) {
		label = name;
	};

	if (fileExt && label) {
		label = `${label}.${fileExt}`;
	};

	if (isError) {
		icon = 'error';
		label = translate('blockMediaFileStateError');
	};

	if (isDeleted) {
		icon = 'ghost';
		label = translate('commonDeletedObject');
		cn.push('deleted');
	};

	return (
		<div className={cn.join(' ')}>
			<Icon className={icon} />
			{label ? <Label text={label} /> : ''}
		</div>
	);

}));

export default BlockLoader;
