import * as React from 'react';
import { forwardRef, useImperativeHandle, useRef, useEffect, useCallback, useState } from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { I, C, S, U, J, analytics, translate, keyboard, Action } from 'Lib';
import { Cover, Filter, Icon, Label, EmptySearch, Loader } from 'Component';

enum Tab {
	Gallery	 = 0,
	Unsplash = 1,
	Library	 = 2,
	Upload	 = 3,
};

const LIMIT = 36;

const MenuBlockCover = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const { data } = param;

	const _isMounted = useRef(false);
	const node = useRef<any>(null);
	const [ filter, setFilter ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const items = useRef<any[]>([]);
	const filterText = useRef('');
	const refFilter = useRef<any>(null);
	const timeout = useRef(0);
	const [ tab, setTabState ] = useState<Tab>(Tab.Gallery);

	const unbind = useCallback(() => {
		$(window).off('paste.menuBlockCover');
	}, []);

	const onPaste = useCallback((e: any) => {
		const { rootId } = data;
		const files = U.Common.getDataTransferFiles((e.clipboardData || e.originalEvent.clipboardData).items);

		if (!files.length) {
			return;
		};

		setIsLoading(true);

		U.Common.saveClipboardFiles(files, {}, (data: any) => {
			if (!data.files.length) {
				setIsLoading(false);
				return;
			};

			C.FileUpload(S.Common.space, '', data.files[0].path, I.FileType.Image, {}, (message: any) => {
				if (!message.error.code) {
					U.Object.setCover(rootId, I.CoverType.Upload, message.objectId);
				};

				setIsLoading(false);
				close();
			});
		});
	}, [ data, close ]);

	const rebind = useCallback(() => {
		unbind();
		$(window).on('paste.menuBlockCover', e => onPaste(e));
	}, [ unbind, onPaste ]);

	const load = useCallback(() => {
		items.current = [];

		if (![ Tab.Unsplash, Tab.Library ].includes(tab)) {
			setIsLoading(false);
			return;
		};

		switch (tab) {
			case Tab.Unsplash: {
				setIsLoading(true);

				C.UnsplashSearch(filter, LIMIT, (message: any) => {
					if (message.error.code) {
						setIsLoading(false);
						return;
					};

					message.pictures.forEach((item: any) => {
						items.current.push({
							id: item.id,
							type: I.CoverType.Source,
							src: item.url,
							artist: item.artist,
						});
					});

					setIsLoading(false);
				});
				break;
			};

			case Tab.Library: {
				const filters: I.Filter[] = [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Image },
				];
				const sorts = [ 
					{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
					{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
				];

				setIsLoading(true);

				U.Subscription.search({
					filters,
					sorts,
					fullText: filter,
					limit: 1000,
				}, (message: any) => {
					setIsLoading(false);

					if (message.error.code) {
						return;
					};

					message.records.forEach((item: any) => {
						items.current.push({
							id: item.id,
							type: I.CoverType.Upload,
							src: S.Common.imageUrl(item.id, I.ImageSize.Medium),
							artist: item.name,
							coverY: -0.25,
						});
					});
				});
				break;
			};
		};
	}, [ filter, tab ]);

	const setTab = useCallback((newTab: Tab) => {
		setTabState(newTab);
		load();
	}, [ load ]);

	const getSections = useCallback(() => {
		let sections: any[] = [];
		switch (tab) {
			case Tab.Gallery: {
				sections = sections.concat([
					{ name: translate('menuBlockCoverGradients'), children: U.Menu.getCoverGradients() },
					{ name: translate('menuBlockCoverSolidColors'), children: U.Menu.getCoverColors() },
				]);
				break;
			};

			case Tab.Library:
			case Tab.Unsplash: {
				if (items.current.length) {
					sections.push({ children: items.current });
				};
				break;
			};
		};
		return sections;
	}, [ tab ]);

	const onUpload = useCallback((e: any) => {
		const { onUpload, onUploadStart } = data;

		Action.openFileDialog({ extensions: J.Constant.fileExtension.cover }, paths => {
			close();

			if (onUploadStart) {
				onUploadStart();
			};

			C.FileUpload(S.Common.space, '', paths[0], I.FileType.Image, {}, (message: any) => {
				if (message.error.code) {
					return;
				};

				if (onUpload) {
					onUpload(I.CoverType.Upload, message.objectId);
				};

				analytics.event('SetCover', { type: I.CoverType.Upload });
			});
		});
	}, [ data, close ]);

	const onSelect = useCallback((e: any, item: any) => {
		const { rootId, onSelect, onUpload, onUploadStart } = data;
		const object = S.Detail.get(rootId, rootId, J.Relation.cover, true);

		if (!object.coverId) {
			close();
		};

		if (item.type == I.CoverType.Source) {
			if (onUploadStart) {
				onUploadStart();
			};

			C.UnsplashDownload(S.Common.space, item.id, (message: any) => {
				if (!message.error.code) {
					onUpload(item.type, message.objectId);
				};
			});

			close();
		} else
		if (onSelect) {
			onSelect(item);
		};

		analytics.event('SetCover', { type: item.type, id: item.id });
	}, [ data, close ]);

	const onFilterChange = useCallback((v: string) => {
		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => setFilter(v), J.Constant.delay.keyboard);
	}, []);

	const onDragOver = useCallback((e: any) => {
		if (!_isMounted.current || !U.File.checkDropFiles(e)) {
			return;
		};
		
		const nodeEl = $(node.current);
		const zone = nodeEl.find('.dropzone');

		zone.addClass('isDraggingOver');
	}, []);
	
	const onDragLeave = useCallback((e: any) => {
		if (!_isMounted.current || !U.File.checkDropFiles(e)) {
			return;
		};
		
		const nodeEl = $(node.current);
		const zone = nodeEl.find('.dropzone');

		zone.removeClass('isDraggingOver');
	}, []);
	
	const onDrop = useCallback((e: any) => {
		if (!_isMounted.current || !U.File.checkDropFiles(e)) {
			return;
		};
		
		const { rootId } = data;
		const electron = U.Common.getElectron();
		const file = electron.webFilePath(e.dataTransfer.files[0]);
		const nodeEl = $(node.current);
		const zone = nodeEl.find('.dropzone');
		
		zone.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);
		setIsLoading(true);
		
		C.FileUpload(S.Common.space, '', file, I.FileType.Image, {}, (message: any) => {
			setIsLoading(false);
			keyboard.disableCommonDrop(false);
			
			if (!message.error.code) {
				U.Object.setCover(rootId, I.CoverType.Upload, message.objectId);
			};
		
			close();
		});
	}, [ data, close ]);

	useEffect(() => {
		_isMounted.current = true;
		load();
		rebind();

		keyboard.disablePaste(true);

		return () => {
			_isMounted.current = false;
			unbind();
			keyboard.disablePaste(false);
		};
	}, [ load, rebind, unbind ]);

	useEffect(() => {
		if (filterText.current != filter) {
			filterText.current = filter;
			load();
		};
	}, [ filter, load ]);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		load,
		setTab,
		getSections,
		getItems: () => items.current,
		getIndex: () => -1, // Not used in this component
		setIndex: (i: number) => {}, // Not used in this component
		onUpload,
		onSelect,
		onFilterChange,
		onDragOver,
		onDragLeave,
		onDrop,
		onPaste,
	}), [ rebind, unbind, load, setTab, getSections, onUpload, onSelect, onFilterChange, onDragOver, onDragLeave, onDrop, onPaste ]);

	const tabs: any[] = [
		{ id: Tab.Gallery, name: translate('menuBlockCoverGallery') },
		{ id: Tab.Unsplash, name: translate('menuBlockCoverUnsplash') },
		{ id: Tab.Library, name: translate('menuBlockCoverLibrary') },
		{ id: Tab.Upload, name: translate('menuBlockCoverUpload') },
	].filter(it => it);
	const sections = getSections();

	const Item = (item: any) => (
		<div className="item" onClick={e => onSelect(e, item)}>
			<Cover preview={true} {...item} />
			{item.artist ? <div className="name">{item.artist}</div> : ''}
		</div>
	);

	const Section = (item: any) => (
		<div className="section">
			<div className="name">{item.name}</div>
			<div className="items">
				{item.children.map((item: any, i: number) => (
					<Item key={i} {...item} />
				))}
			</div>
		</div>
	);

	let content = null;
	let filterElement = null;

	if ([ Tab.Unsplash, Tab.Library ].includes(tab)) {
		filterElement = (
			<Filter 
				ref={ref => refFilter.current = ref}
				className="outlined"
				value={filter}
				onChange={onFilterChange} 
			/>
		);
	};

	switch (tab) {
		case Tab.Gallery:
		case Tab.Unsplash:
		case Tab.Library: {
			content = (
				<>
					{sections.length ? (
						<div className="sections">
							{sections.map((section: any, i: number) => (
								<Section key={i} {...section} />
							))}
						</div>
					) : <EmptySearch text={filter ? U.Common.sprintf(translate('menuBlockCoverEmptyFilter'), filter) : translate('menuBlockCoverEmpty')} />}
				</>
			);
			break;
		};

		case Tab.Upload: {
			content = (
				<div 
					className="dropzone" 
					onDragOver={onDragOver} 
					onDragLeave={onDragLeave} 
					onDrop={onDrop}
					onClick={onUpload}
				>
					<Icon className="coverUpload" />
					<Label text={translate('menuBlockCoverChoose')} />
				</div>
			);
			break;
		};
	};

	if (isLoading) {
		content = <Loader />;
	};

	return (
		<div 
			ref={node}
			className="wrap"
		>
			<div className="head">
				{tabs.map((item: any, i: number) => (
					<div 
						key={item.id} 
						className={[ 'btn', (item.id == tab ? 'active' : '') ].join(' ')}
						onClick={() => setTab(item.id)}
					>
						{item.name}
					</div>
				))}
			</div>

			<div className={[ 'body', Tab[tab].toLowerCase() ].join(' ')}>
				{filterElement}
				{content}
			</div>
		</div>
	);

}));

export default MenuBlockCover;
