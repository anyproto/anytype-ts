import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { ObjectName, IconObject, Label } from 'Component';
import { U, I, translate, S } from 'Lib';

interface Props {
	spaceview?: any;
	data?: any;
	position?: () => void;
};

const PreviewTab = observer(forwardRef<{}, Props>((props, ref) => {

	const {
		spaceview = {},
		data,
		position,
	} = props;

	const { object, name, action } = data;
	const [ displayObject, setDisplayObject ] = useState<any>(null);
	const [ displayObjectType, setDisplayObjectType ] = useState<any>(null);
	const cancelRef = useRef(false);

	useEffect(() => {
		cancelRef.current = false;
		setDisplayObject(null);
		setDisplayObjectType(null);
		load();

		return () => {
			cancelRef.current = true;
		};
	}, [ object?.id, action, spaceview.targetSpaceId ]);

	useEffect(position);

	const load = () => {
		const isChat = (object?.layout == I.ObjectLayout.SpaceView) && (spaceview.isOneToOne || spaceview.isChat);

		if (isChat) {
			setDisplayObject({ layout: I.ObjectLayout.Chat, name: translate('commonMainChat') });
		} else
		if (action && name) {
			objectByAction();
		} else {
			loadObject();
		};
	};

	const objectByAction = () => {
		const layouts = {
			navigation: I.ObjectLayout.Navigation,
			graph: I.ObjectLayout.Graph,
			archive: I.ObjectLayout.Archive,
			settings: I.ObjectLayout.Settings,
		};

		if (layouts[action]) {
			setDisplayObject({ layout: layouts[action], name });
		} else {
			loadObject();
		};
	};

	const loadObject = () => {
		if (!object || !object.id) {
			return;
		};
		U.Object.getById(object.id, { spaceId: spaceview.targetSpaceId }, (loaded: any) => {
			if (loaded && !cancelRef.current) {
				setDisplayObject(loaded);
				loadType(loaded.type);
			};
		});
	};

	const loadType = (id: string) => {
		U.Object.getById(id, { spaceId: spaceview.targetSpaceId }, (loaded: any) => {
			if (loaded && !cancelRef.current) {
				setDisplayObjectType(loaded);
			};
		});
	};

	return (
		<div className="previewTab">
			<div className="previewHeader">
				<IconObject object={spaceview} />
				<ObjectName object={spaceview} />
			</div>
			{displayObject?.name ? (
				<div className="previewObject">
					<div className="side left">
						<IconObject object={displayObject} size={48} iconSize={28} />
					</div>
					<div className="side right">
						<ObjectName object={displayObject} />
						{displayObjectType ? <Label className="type" text={displayObjectType.name} /> : ''}
					</div>
				</div>
			) : null}
		</div>
	);

}));

export default PreviewTab;
