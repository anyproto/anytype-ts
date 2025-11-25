import React, { FC, MouseEvent } from 'react';
import { Icon } from 'Component';
import { translate } from 'Lib';

interface Props {
	onClick? (e: MouseEvent): void;
};

const RowAdd: FC<Props> = ({ onClick }) => {

	return (
		<div className="row add">
			<div className="cell add">
				<div className="btn" onClick={onClick}>
					<Icon className="plus" />
					<div className="name">{translate('commonNewObject')}</div>
				</div>
			</div>
		</div>
	);

};

export default RowAdd;