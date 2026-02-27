import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, M, C, S, U, Action, Relation, keyboard, translate } from 'Lib';
import { Block, Button, DragHorizontal } from 'Component';

interface Props extends I.BlockComponent {
	setLayoutWidth?(v: number): void;
};

interface RefProps {
	getDrag: () => any;
	setPercent: (v: number) => void;
};

const PageHeadEditor = observer(forwardRef<RefProps, Props>((props, ref) => {

	const { rootId, isPopup, readonly, onKeyDown, onKeyUp, onMenuAdd, onPaste, setLayoutWidth } = props;
	const dragRef = useRef(null);
	const dragValueRef = useRef(null);
	const check = U.Data.checkDetails(rootId, rootId, []);
	const isBookmark = U.Object.isBookmarkLayout(check.layout);
	const header = S.Block.getLeaf(rootId, 'header');
	const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, hAlign: check.layoutAlign, childrenIds: [], fields: {}, content: {} });
	const icon: any = new M.Block({ id: rootId + '-icon', type: I.BlockType.IconPage, hAlign: check.layoutAlign, childrenIds: [], fields: {}, content: {} });

	if (U.Object.isInHumanLayouts(check.layout)) {
		icon.type = I.BlockType.IconUser;
	};

	const init = () => {
		const pageContainer = U.Common.getPageContainer(isPopup);

		pageContainer.find('#editorWrapper').attr({ class: [ 'editorWrapper', check.className ].join(' ') });
		U.Common.triggerResizeEditor(isPopup);
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
		$(dragValueRef.current).text(Math.ceil((v + 1) * 100) + '%');
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

	let bookmarkHead = null;
	let bookmarkFoot = null;

	if (isBookmark) {
		const object = S.Detail.get(rootId, rootId, [ 'source', 'picture', 'iconImage' ]);
		const { source, picture, iconImage } = object;
		const type = S.Record.getTypeById(object.type);
		const allowedDetails = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);

		let relations = Relation.getArrayValue(type?.recommendedFileRelations).
			map(it => S.Record.getRelationById(it));

		relations = relations.filter(it => it);
		relations = S.Record.checkHiddenObjects(relations);

		bookmarkHead = (
			<>
				{picture ? (
					<div className="bookmarkOgImage" style={{ backgroundImage: `url("${S.Common.imageUrl(picture, I.ImageSize.Large)}")` }} />
				) : ''}

				{source ? (
					<div className="bookmarkLink">
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
						<Button text={translate('pageMainBookmarkOpenWebsite')} color="blank" className="c36" onClick={() => Action.openUrl(source)} />
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
			<div id="editorSize" className="dragWrap">
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
				onMouseEnter={() => $(`#editor-controls-${rootId}`).addClass('hover')}
				onMouseLeave={() => $(`#editor-controls-${rootId}`).removeClass('hover')}
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

}));

export default PageHeadEditor;