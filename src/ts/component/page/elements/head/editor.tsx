import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import { Block, Button, DragHorizontal, Loader } from 'Component';
import * as I from 'Interface';
import * as M from 'Model';

interface Props extends I.BlockComponent {
	setLayoutWidth?(v: number): void;
};

interface RefProps {
	getDrag: () => any;
	setPercent: (v: number) => void;
};

const PageHeadEditor = forwardRef<RefProps, Props>((props, ref) => {

	const { rootId, isPopup, readonly, onKeyDown, onKeyUp, onMenuAdd, onPaste, setLayoutWidth } = props;
	const dragRef = useRef(null);
	const dragValueRef = useRef(null);
	const wrapperRef = useRef(null);
	const check = U.Data.checkDetails(rootId, rootId, []);
	const isBookmark = U.Object.isBookmarkLayout(check.layout);
	const header = S.Block.getLeaf(rootId, 'header');
	const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, hAlign: check.layoutAlign, childrenIds: [], fields: {}, content: {} });
	const icon: any = new M.Block({ id: rootId + '-icon', type: I.BlockType.IconPage, hAlign: check.layoutAlign, childrenIds: [], fields: {}, content: {} });

	if (U.Object.isInHumanLayouts(check.layout)) {
		icon.type = I.BlockType.IconUser;
	};

	const init = () => {
		const wrapper = wrapperRef.current?.closest('#editorWrapper');

		if (wrapper) {
			wrapper.className = [ 'editorWrapper', check.className ].join(' ');
		};
		U.Dom.triggerResizeEditor(isPopup);
	};

	const onScaleStart = (e: any, v: number) => {
		keyboard.disableSelection(true);
		setPercent(v);
	};
	
	const onScaleMove = (e: any, v: number) => {
		setLayoutWidth(v);
		setPercent(v);
	};
	
	const onScaleEnd = (e: any, v: number) => {
		keyboard.disableSelection(false);
		setLayoutWidth(v);
		setPercent(v);

		const root = S.Block.getLeaf(rootId, rootId);
		if (!root) {
			return;
		};

		C.BlockListSetFields(rootId, [
			{ blockId: rootId, fields: { ...root.fields, width: v } },
		]);
	};

	const setPercent = (v: number) => {
		if (dragValueRef.current) {
			dragValueRef.current.textContent = Math.ceil((v + 1) * 100) + '%';
		};
	};

	useEffect(() => {
		init();
	});

	useEffect(() => {
		dragRef.current?.setValue(check.layoutWidth);
		setPercent(check.layoutWidth);
	}, [ check.layoutWidth ]);

	useImperativeHandle(ref, () => ({
		getDrag: () => dragRef.current,
		setPercent: (v: number) => setPercent(v),
	}));

	const [ ogImageLoaded, setOgImageLoaded ] = useState(false);
	const ogImageUrlRef = useRef('');
	const bookmarkObject = isBookmark ? S.Detail.get(rootId, rootId, [ 'source', 'picture', 'iconImage' ]) : null;
	const bookmarkPicture = bookmarkObject?.picture || '';
	const ogImageUrl = bookmarkPicture ? S.Common.imageUrl(bookmarkPicture, I.ImageSize.Large) : '';

	useEffect(() => {
		if (!ogImageUrl || (ogImageUrl === ogImageUrlRef.current)) {
			return;
		};

		ogImageUrlRef.current = ogImageUrl;
		setOgImageLoaded(false);

		const img = new Image();
		img.onload = () => setOgImageLoaded(true);
		img.onerror = () => setOgImageLoaded(true);
		img.src = ogImageUrl;
	}, [ ogImageUrl ]);

	let bookmarkHead = null;
	let bookmarkFoot = null;

	if (isBookmark) {
		const object = bookmarkObject;
		const { source, picture, iconImage } = object;
		const type = S.Record.getTypeById(object.type);
		const allowedDetails = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);

		let relations = Relation.getArrayValue(type?.recommendedFileRelations).
			map(it => S.Record.getRelationById(it));

		relations = relations.filter(it => it);
		relations = S.Record.checkHiddenObjects(relations);

		const onSourceContextMenu = (e: any) => {
			e.preventDefault();

			const relation = S.Record.getRelationByKey('source');
			if (!relation) {
				return;
			};

			const canEdit = allowedDetails && !readonly && !relation.isReadonlyValue;
			const actions = source ? [
				{ id: 'go', iconParam: { name: 'menu/action/browse' }, name: translate(`menuDataviewUrlActionGo${I.RelationType.Url}`) },
				{ id: 'copy', iconParam: { name: 'menu/action/copy' }, name: translate('commonCopy') },
				{ id: 'reload', iconParam: { name: 'menu/action/reload' }, name: translate('menuDataviewUrlActionGoReload') },
			] : [];

			S.Menu.open('dataviewText', {
				title: relation.name,
				className: 'withTitle',
				width: J.Size.menu.value,
				recalcRect: () => ({ x: keyboard.mouse.page.x, y: keyboard.mouse.page.y, width: 0, height: 0 }),
				data: {
					value: String(source || ''),
					relationKey: relation.relationKey,
					placeholder: relation.name,
					canEdit,
					noResize: true,
					actions,
					onChange: (v: any) => {
						if (!canEdit) {
							return;
						};

						const value = Relation.formatValue(relation, v, true);
						if (value == source) {
							return;
						};

						C.ObjectListSetDetails([ rootId ], [ { key: 'source', value } ]);
						analytics.changeRelationValue(relation, value, { type: 'menu', id: 'Single' });
					},
					onSelect: (e: any, item: any) => {
						switch (item.id) {
							case 'go': {
								Action.openUrl(Relation.checkUrlScheme(I.RelationType.Url, source));
								analytics.event('RelationUrlOpen');
								break;
							};

							case 'copy': {
								U.Common.copyToast(translate('commonLink'), source);
								analytics.event('RelationUrlCopy');
								break;
							};

							case 'reload': {
								C.ObjectBookmarkFetch(rootId, String(source).trim(), () => analytics.event('ReloadSourceData'));
								break;
							};
						};
					},
				},
			});
		};

		bookmarkHead = (
			<>
				{picture ? (
					<div className={[ 'bookmarkOgImage', (ogImageLoaded ? 'isLoaded' : '') ].join(' ')} style={ogImageLoaded ? { backgroundImage: `url("${ogImageUrl}")` } : {}}>
						{!ogImageLoaded ? <Loader type={I.LoaderType.Loader} /> : ''}
					</div>
				) : ''}

				{source ? (
					<div className="bookmarkLink" onClick={() => Action.openUrl(source)} onContextMenu={onSourceContextMenu}>
						{iconImage ? <img className="fav" src={S.Common.imageUrl(iconImage, I.ImageSize.Small)} /> : ''}
						<div className="url">{U.String.shortUrl(source)}</div>
					</div>
				) : ''}
			</>
		);

		bookmarkFoot = (
			<>
				{source ? (
					<div className="bookmarkButtons">
						<Button text={translate('pageMainBookmarkOpenWebsite')} color="blank" size={36} onClick={() => Action.openUrl(source)} />
					</div>
				) : ''}

				{relations.length ? (
					<div className="bookmarkSection">
						<div className="title">{translate('pageMainBookmarkLinkInfo')}</div>

						{relations.map((item: any) => (
							<Block
								{...props}
								key={item.id}
								rootId={rootId}
								block={new M.Block({ id: item.id, type: I.BlockType.Relation, content: { key: item.relationKey } })}
								readonly={!allowedDetails}
								isSelectionDisabled={true}
								isContextMenuDisabled={true}
							/>
						))}
					</div>
				) : ''}
			</>
		);
	};

	return (
		<>
			<div ref={wrapperRef} id="editorSize" className="dragWrap">
				<DragHorizontal
					ref={dragRef}
					value={check.layoutWidth}
					snaps={[ 0.25, 0.5, 0.75 ]}
					onStart={onScaleStart}
					onMove={onScaleMove}
					onEnd={onScaleEnd}
				/>
				<div ref={dragValueRef} className="number">100%</div>
			</div>

			{check.withCover ? <Block {...props} key={cover.id} block={cover} className="noPlus" /> : ''}

			{bookmarkHead}

			<div
				onMouseEnter={() => U.Dom.addClass(U.Dom.get(`editor-controls-${rootId}`), 'hover')}
				onMouseLeave={() => U.Dom.removeClass(U.Dom.get(`editor-controls-${rootId}`), 'hover')}
			>
				{check.withIcon ? <Block {...props} key={icon.id} block={icon} className="noPlus" /> : ''}
				<Block
					key={header?.id}
					{...props}
					readonly={readonly}
					index={0}
					block={header}
					contextParam={{ hAlign: check.layoutAlign }}
					onKeyDown={onKeyDown}
					onKeyUp={onKeyUp}
					onMenuAdd={onMenuAdd}
					onPaste={onPaste}
				/>
			</div>

			{bookmarkFoot}
		</>
	);

});

export default PageHeadEditor;