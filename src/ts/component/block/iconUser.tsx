import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { IconObject, Loader } from 'Component';
import { I, S, U } from 'Lib';

interface BlockIconUserRefProps {
	setLoading: (v: boolean) => void;
};

const BlockIconUser = observer(forwardRef<BlockIconUserRefProps, I.BlockComponent>(({
	rootId = '',
	readonly = false,
}, ref) => {

	const [ isLoading, setIsLoading ] = useState(false);

	const onSelect = () => {
		setIsLoading(true);
		U.Object.setIcon(rootId, '', '', () => setIsLoading(false));
	};

	const onUpload = (objectId: string) => {
		setIsLoading(true);
		U.Object.setIcon(rootId, '', objectId, () => setIsLoading(false));
	};

	useImperativeHandle(ref, () => ({
		setLoading: (v: boolean) => setIsLoading(v),
	}));

	return (
		<div className="wrap">
			{isLoading ? <Loader /> : ''}
			<IconObject
				id={`block-icon-${rootId}`} 
				getObject={() => S.Detail.get(rootId, rootId, [])}
				className={readonly ? 'isReadonly' : ''}
				canEdit={!readonly}
				onSelect={onSelect}
				onUpload={onUpload}
				size={128}
				iconSize={128}
				menuParam={{
					horizontal: I.MenuDirection.Center,
				}}
			/>
		</div>
	);
}));

export default BlockIconUser;