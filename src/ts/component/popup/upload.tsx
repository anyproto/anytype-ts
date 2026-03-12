import React, { forwardRef, useRef, useState, useEffect, DragEvent, MouseEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Input, Button, Loader } from 'Component';
import { I, C, S, U, translate, Action, analytics, Preview } from 'Lib';

enum Tab {
	Upload = 0,
	Link = 1,
};

const PopupUpload = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { layout, onUpload, collectionId, details } = data;
	const [ tab, setTab ] = useState(Tab.Upload);
	const [ isDragging, setIsDragging ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);
	const urlRef = useRef(null);
	const dragCounter = useRef(0);

	const fileType = U.Object.getFileTypeByLayout(layout);
	const extensions = U.File.getExtensionsByLayout(layout);

	const onDragEnter = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		dragCounter.current++;
		setIsDragging(true);
	};

	const onDragLeave = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		dragCounter.current--;
		if (dragCounter.current <= 0) {
			dragCounter.current = 0;
			setIsDragging(false);
		};
	};

	const onDragOver = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		dragCounter.current = 0;
		setIsDragging(false);

		const { files } = e.dataTransfer;
		if (!files || !files.length) {
			return;
		};

		const electron = U.Common.getElectron();
		const paths: string[] = [];

		for (let i = 0; i < files.length; i++) {
			const path = electron.webFilePath(files[i]);
			if (path) {
				paths.push(path);
			};
		};

		if (paths.length) {
			uploadFiles(paths);
		};
	};

	const onClickZone = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		Action.openFileDialog({ extensions, properties: [ 'multiSelections' ] }, (paths: string[]) => {
			if (paths.length) {
				uploadFiles(paths);
			};
		});
	};

	const onPaste = (e: any) => {
		const cb = e.clipboardData || e.originalEvent?.clipboardData;
		if (!cb) {
			return;
		};

		const items = cb.items;
		if (!items || !items.length) {
			return;
		};

		const electron = U.Common.getElectron();
		const paths: string[] = [];

		for (let i = 0; i < items.length; i++) {
			if (items[i].kind == 'file') {
				const file = items[i].getAsFile();
				if (file) {
					const path = electron.webFilePath(file);
					if (path) {
						paths.push(path);
					};
				};
			};
		};

		if (paths.length) {
			e.preventDefault();
			e.stopPropagation();
			uploadFiles(paths);
		};
	};

	const layoutToCountKey = (l: I.ObjectLayout): string => {
		switch (l) {
			case I.ObjectLayout.Image: return 'image';
			case I.ObjectLayout.Video: return 'video';
			case I.ObjectLayout.Audio: return 'audio';
			default: return 'file';
		};
	};

	const showUploadToast = (counts: { [key: string]: number }) => {
		Preview.toastShow({ action: I.ToastAction.Upload, uploadCounts: counts });
	};

	const uploadFiles = (paths: string[]) => {
		setIsLoading(true);

		const space = S.Common.space;
		const electron = U.Common.getElectron();
		let completed = 0;
		const objectIds: string[] = [];
		const counts: { [key: string]: number } = {};

		const cb = () => {
			setIsLoading(false);
			showUploadToast(counts);
			onUpload?.(objectIds);
			close();
		};

		for (const path of paths) {
			const mime = electron.fileMime(path);
			const fileLayout = U.File.layoutByMime(mime);
			const type = U.Object.getFileTypeByLayout(fileLayout);
			const key = layoutToCountKey(fileLayout);

			C.FileUpload(space, '', path, type, details || {}, false, '', I.ImageKind.Basic, '', '', (message: any) => {
				completed++;

				if (!message.error.code && message.objectId) {
					objectIds.push(message.objectId);
					counts[key] = (counts[key] || 0) + 1;

					if (collectionId) {
						C.ObjectCollectionAdd(collectionId, [ message.objectId ]);
					};
				};

				if (completed >= paths.length) {
					cb();
				};
			});
		};

		analytics.event('UploadMedia', { type: fileType });
	};

	const onSubmitUrl = (e: any) => {
		e.preventDefault();

		const url = String(urlRef.current?.getValue() || '').trim();
		if (!url) {
			return;
		};

		setIsLoading(true);

		C.FileUpload(S.Common.space, url, '', fileType, details || {}, false, '', I.ImageKind.Basic, '', '', (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				return;
			};

			const objectIds = message.objectId ? [ message.objectId ] : [];
			const key = layoutToCountKey(layout);

			if (message.objectId && collectionId) {
				C.ObjectCollectionAdd(collectionId, [ message.objectId ]);
			};

			showUploadToast({ [key]: 1 });
			onUpload?.(objectIds);
			close();
		});

		analytics.event('UploadMedia', { type: fileType });
	};

	useEffect(() => {
		$(window).on(`paste.popupUpload`, onPaste);
		return () => {
			$(window).off(`paste.popupUpload`);
		};
	}, []);

	const tabs = [
		{ id: Tab.Upload, name: translate('popupUploadTabUpload') },
		{ id: Tab.Link, name: translate('popupUploadTabLink') },
	];

	return (
		<div className="wrap">
			{isLoading ? <Loader /> : ''}

			<div className="tabs">
				{tabs.map(it => (
					<div
						key={it.id}
						className={[ 'tab', (it.id == tab ? 'active' : '') ].join(' ')}
						onClick={() => setTab(it.id)}
					>
						{it.name}
					</div>
				))}
			</div>

			{tab == Tab.Upload ? (
				<div
					className={[ 'dropZone', (isDragging ? 'isDragging' : '') ].join(' ')}
					onDragEnter={onDragEnter}
					onDragLeave={onDragLeave}
					onDragOver={onDragOver}
					onDrop={onDrop}
					onClick={onClickZone}
				>
					<Icon className="upload" />
					<div className="label">{translate('popupUploadDropLabel')}</div>
				</div>
			) : ''}

			{tab == Tab.Link ? (
				<form className="linkForm" onSubmit={onSubmitUrl}>
					<Input
						ref={urlRef}
						placeholder={translate('popupUploadLinkPlaceholder')}
						onKeyDown={e => e.stopPropagation()}
					/>
					<Button type="input" text={translate('commonUpload')} onClick={onSubmitUrl} />
				</form>
			) : ''}
		</div>
	);

}));

export default PopupUpload;
