import React, { FC, ReactNode } from 'react';
import { I, U } from 'Lib';

interface Props {
	id: string;
	type: I.SelectType;
	children?: ReactNode;
	style?: any;
	className?: string;
	onContextMenu?(e: any): void;
};

const SelectionTarget: FC<Props> = ({
	id = '',
	className = '',
	type = '',
	children,
	style = {},
	onContextMenu,
}) => {

	const cn = [ 'selectionTarget', className ];

	return (
		<div 
			id={`selectionTarget-${id}`} 
			className={cn.join(' ')}
			style={style}
			onContextMenu={onContextMenu}
			{...U.Common.dataProps({ id, type })}
		>
			{children}
		</div>
	);
};

export default SelectionTarget;