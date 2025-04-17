import React, { forwardRef, useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import { ObjectName, ObjectDescription, ObjectType, IconObject, Loader } from 'Component';
import { S, U } from 'Lib';

interface Props {
	rootId?: string;
	object?: any;
	className?: string;
	withPlural?: boolean;
	position?: () => void;
	setObject?: (object: any) => void;
};

const PreviewDefault = observer(forwardRef<{}, Props>((props, ref) => {

	const { 
		rootId = '',
		className = '',
		object: initialObject,
		position,
		setObject: setParentObject,
		withPlural = false,
	} = props;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ object, setObject ] = useState(initialObject);
	const idRef = useRef(null);
	const cn = [ 'previewDefault', className ];
	const type = S.Record.getTypeById(object?.type);

	if (object && U.Object.isParticipantLayout(object.layout)) {
		object.name = object.globalName || object.name;
	};

	const load = () => {
		if (isLoading || (idRef.current == rootId)) {
			return;
		};

		idRef.current = rootId;
		setIsLoading(true);

		U.Object.getById(rootId, {}, object => {
			setIsLoading(false);

			if (!object) {
				return;
			};

			setObject(object);

			if (setParentObject) {
				setParentObject(object);
			};
		});
	};

	useEffect(() => load(), [ rootId ]);

	return (
		<div className={cn.join(' ')}>
			{isLoading ? <Loader /> : (
				<>
					<div className="previewHeader">
						<IconObject object={object} />
						<ObjectName object={object} withPlural={withPlural} withLatex={true} />
					</div>
					<ObjectDescription object={object} />
					<div className="featured">
						<ObjectType object={type} />
					</div>
				</>
			)}
		</div>
	);

}));

export default PreviewDefault;