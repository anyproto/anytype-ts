import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Loader } from 'Component';
import { I, C, S, U, J, focus, keyboard, analytics } from 'Lib';
import ControlButtons from './controlButtons';

interface Props extends I.PageComponent {
	readonly?: boolean;
	resize?: () => void;
	onLayoutSelect?: (layout: I.ObjectLayout) => void;
};

interface RefProps {
	forceUpdate: () => void;
};

const Controls = observer(forwardRef<RefProps, Props>((props, ref) => {

	const { rootId, readonly, resize, onLayoutSelect } = props;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const object = S.Detail.get(rootId, rootId, J.Relation.cover);
	const cn = [ 'editorControls', 'editorControlElements' ];
	const nodeRef = useRef(null);
	const buttonsRef = useRef(null);
	
	if (isLoading) {
		cn.push('active');
	};

	const onIcon = (e: any) => {
		const node = $(nodeRef.current);
		const object = S.Detail.get(rootId, rootId, []);
		const cb = () => S.Menu.update('smile', { element: `#block-icon-${rootId}` });
		const isType = U.Object.isTypeLayout(object.layout);

		focus.clear(true);

		S.Menu.open('smile', { 
			classNameWrap: 'fromBlock',
			element: node.find('#button-icon'),
			horizontal: I.MenuDirection.Center,
			onOpen: () => node.addClass('hover'),
			onClose: () => node.removeClass('hover'),
			data: {
				noUpload: isType,
				noGallery: isType,
				withIcons: isType,
				value: (object.iconEmoji || object.iconImage || ''),
				onSelect: (icon: string) => {
					U.Object.setIcon(rootId, icon, '', cb);
				},
				onIconSelect: (iconName: string, iconOption: number) => {
					U.Object.setTypeIcon(rootId, iconName, iconOption);
				},
				onUpload (objectId: string) {
					U.Object.setIcon(rootId, '', objectId, cb);
				},
				route: analytics.route.icon,
			}
		});
	};
	
	const onCoverOpen = () => {
		$(nodeRef.current).addClass('hover');
	};

	const onCoverClose = () => {
		$(nodeRef.current).removeClass('hover');
	};

	const onCoverSelect = (item: any) => {
		U.Object.setCover(rootId, item.type, item.id, item.coverX, item.coverY, item.coverScale);
	};

	const onLayout = () => {
		const node = $(nodeRef.current);
		
		S.Menu.open('blockLayout', { 
			classNameWrap: 'fromBlock',
			element: '.editorControls #button-layout',
			onOpen: () => node.addClass('hover'),
			onClose: () => node.removeClass('hover'),
			subIds: J.Menu.layout,
			data: {
				rootId,
				onLayoutSelect,
			}
		});
	};

	const onDragOver = (e: any) => {
		if (U.File.checkDropFiles(e)) {
			$(nodeRef.current).addClass('isDraggingOver');
		};
	};
	
	const onDragLeave = (e: any) => {
		if (U.File.checkDropFiles(e)) {
			$(nodeRef.current).removeClass('isDraggingOver');
		};
	};
	
	const onDrop = (e: any) => {
		if (!U.File.checkDropFiles(e)) {
			return;
		};
		
		const electron = U.Common.getElectron();
		const file = electron.webFilePath(e.dataTransfer.files[0]);
		const node = $(nodeRef.current);
		
		node.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);
		setIsLoading(true);
		
		C.FileUpload(S.Common.space, '', file, I.FileType.Image, {}, (message: any) => {
			setIsLoading(false);
			keyboard.disableCommonDrop(false);
			
			if (!message.error.code) {
				onUpload(I.CoverType.Upload, message.objectId);
			};
		});
	};

	const onUploadStart = () => {
		setIsLoading(true);
	};
	
	const onUpload = (type: I.CoverType, objectId: string) => {
		U.Object.setCover(rootId, type, objectId, 0, -0.25, 0, () => setIsLoading(false));
	};

	useEffect(() => {
		resize();
		buttonsRef.current?.forceUpdate();
	});

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
	}));

	if ((object.coverType != I.CoverType.None) && object.coverId) {
		return null;
	};

	return (
		<div 
			ref={nodeRef}
			id={`editor-controls-${rootId}`}
			className={cn.join(' ')}
			onDragOver={onDragOver} 
			onDragLeave={onDragLeave} 
			onDrop={onDrop}
		>
			{isLoading ? <Loader /> : ''}

			<ControlButtons 
				ref={buttonsRef}
				rootId={rootId} 
				readonly={readonly}
				onIcon={onIcon} 
				onCoverOpen={onCoverOpen}
				onCoverClose={onCoverClose}
				onCoverSelect={onCoverSelect}
				onLayout={onLayout}
				onUploadStart={onUploadStart}
				onUpload={onUpload}
			/>
		</div>
	);

}));

export default Controls;