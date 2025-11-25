import React, { FC, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from 'Component';
import { U, translate } from 'Lib';

interface Props {
	className?: string;
	onClick? (e: MouseEvent): void;
};

const AddRow: FC<Props> = ({ 
	className = '',
	onClick,
}) => {

	const cn = [ 'row', 'add', className ];

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				className={cn.join(' ')}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.1 },
				})}
			>
				<div className="cell add">
					<div className="btn" onClick={onClick}>
						<Icon className="plus" />
						<div className="name">{translate('commonNewObject')}</div>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);

};

export default AddRow;