import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { U, I } from 'Lib';
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
		<AnimatePresence mode="popLayout">
			<motion.div
				id={id.join('-')} 
				className={cn.join(' ')}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.1 },
				})}
			>
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
			</motion.div>
		</AnimatePresence>
	);

}));

export default BlockDataviewEmpty;