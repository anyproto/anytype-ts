import React, { forwardRef } from 'react';
import { I } from 'Lib';
import { Label, Button } from 'Component';
import { observer } from 'mobx-react';

const BlockDataviewEmpty = observer(forwardRef<{}, I.ViewEmpty>(({
	block,
	title = '',
	description = '',
	button = '',
	className = '',
	withButton = true,
	onClick,
}, ref) => {

	const id = [ 'dataviewEmpty', block.id ];
	const cn = [ 'dataviewEmpty' ];

	if (className) {
		cn.push(className);
	};

	return (
		<div id={id.join('-')} className={cn.join(' ')}>
			<div className="inner">
				<Label className="name" text={title} />
				<Label className="descr" text={description} />

				{withButton ? (
					<Button 
						id="emptyButton" 
						color="blank" 
						className="c28" 
						text={button} 
						onClick={onClick} 
					/>
				) : ''}
			</div>
		</div>
	);

}));

export default BlockDataviewEmpty;