import React, { FC } from 'react';
import { U, translate } from 'Lib';

interface Props {
	object: any;
};

const ObjectType: FC<Props> = ({
	object = {},
}) => {

	return object && !object._empty_ && !object.isDeleted ? (
		<>{U.String.shorten(U.Object.name(object), 32)}</>
	): (
		<span className="textColor-red">
			{translate('commonDeletedType')}
		</span>
	);

};

export default ObjectType;
