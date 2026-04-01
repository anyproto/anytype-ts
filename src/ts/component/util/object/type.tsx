import React, { FC } from 'react';

interface Props {
	object: any;
};

const ObjectType: FC<Props> = ({
	object = {},
}) => {

	if (!object || object._empty_) {
		return null;
	};

	if (object.isDeleted) {
		return (
			<span className="textColor-red">
				{translate('commonDeletedType')}
			</span>
		);
	};

	return U.String.shorten(U.Object.name(object), 32);

};

export default ObjectType;
