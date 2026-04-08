import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { Title, Label, Icon, IconObject, EmptyNodes, LayoutPlug } from 'Component';
import * as I from 'Interface';

interface RefProps {
	update: (object: any) => void;
	show: (v: boolean) => void;
};

const SidebarLayoutPreview = forwardRef<RefProps, I.SidebarPageComponent>((props, ref) => {

	const { isPopup } = props;
	const [ object, setObject ] = useState({
		name: '',
		pluralName: '',
		recommendedLayout: I.ObjectLayout.Page,
		layoutAlign: I.BlockHAlign.Left,
		layoutWidth: 0,
		layoutFormat: I.LayoutFormat.Page,
		defaultViewType: I.ViewType.Grid,
		headerRelationsLayout: I.FeaturedRelationLayout.Inline,
		recommendedFeaturedRelations: [],
		recommendedFileRelations: [],
	});
	const { name, pluralName, recommendedLayout, layoutAlign, layoutFormat, layoutWidth, headerRelationsLayout } = object;
	const viewType = Number(object.defaultViewType) || I.ViewType.Grid;
	const featured = Relation.getArrayValue(object.recommendedFeaturedRelations).
		map(key => S.Record.getRelationById(key)).
		filter(it => it && !it.isArchived);
	const withDescription = featured.map(it => it.relationKey).includes('description');
	const filtered = featured.filter(it => it.relationKey != 'description');
	const isTask = U.Object.isTaskLayout(recommendedLayout);
	const isHuman = U.Object.isInHumanLayouts(recommendedLayout);
	const isNote = U.Object.isNoteLayout(recommendedLayout);
	const isList = layoutFormat == I.LayoutFormat.List;
	const isFile = U.Object.isInFileLayouts(recommendedLayout);
	const nodeRef = useRef<HTMLDivElement>(null);
	const previewRef = useRef<HTMLDivElement>(null);
	const timeoutRef = useRef<number>(0);
	const ns = `sidebarPreview${U.Dom.getEventNamespace(isPopup)}`;

	const show = (v: boolean) => {
		resize();

		window.clearTimeout(timeoutRef.current);
		timeoutRef.current = window.setTimeout(() => {
			const node = nodeRef.current;
			if (!node) {
				return;
			};

			U.Dom.removeClass(node, 'in out');
			v ? U.Dom.addClass(node, 'in') : U.Dom.addClass(node, 'out');
			U.Dom.toggleClass(node, 'show', v);
		}, 40);
	};

	const getNodeSize = (): { width: number; height: number } => {
		const container = U.Dom.getPageFlexContainer(isPopup);
		const sidebarLeft = sidebar.leftPanelGetNode();
		const sidebarRight = sidebar.rightPanelGetNode(isPopup);

		return {
			width: (container?.clientWidth ?? 0) - (sidebarLeft?.offsetWidth ?? 0) - (sidebarRight?.offsetWidth ?? 0),
			height: container?.clientHeight ?? 0,
		};
	};

	const resize = () => {
		const size = getNodeSize();

		let w = 0;
		if (layoutFormat == I.LayoutFormat.List) {
			w = size.width - 192;
		} else {
			const s = size.width * 0.6;
			const mw = size.width - 96;

			w = Math.max(s, Math.min(mw, s + (mw - s) * layoutWidth));
		};

		w = Math.max(300, w);

		if (nodeRef.current) {
			U.Dom.css(nodeRef.current, { width: `${size.width}px`, height: `${size.height}px` });
		};
		if (previewRef.current) {
			U.Dom.css(previewRef.current, { width: `${w}px` });
		};
	};

	const cn = [
		'layoutPreview',
		`align${layoutAlign}`,
		`defaultView${I.ViewType[viewType]}`,
		U.Data.layoutClass('', recommendedLayout),
		U.String.toCamelCase(`layoutFormat-${I.LayoutFormat[layoutFormat]}`),
		`featuredRelationLayout${I.FeaturedRelationLayout[headerRelationsLayout]}`,
	];

	if (isFile) {
		cn.push('isFile');
	};

	let icon = null;
	if (!isFile) {
		if (isTask) {
			icon = <IconObject object={{ name, layout: recommendedLayout }} size={32} iconSize={28} />;
		} else
		if (isHuman) {
			icon = <IconObject object={{ name, layout: recommendedLayout }} size={96} />;
		} else {
			icon = <Icon key={`sidebar-preview-icon-${layoutFormat}`} name="common/preview" size={isList ? 22 : 56} />;
		};
	};

	const resizeHandler = useRef<() => void>(() => resize());
	const sidebarResizeHandler = useRef<() => void>(() => resize());

	const unbind = () => {
		if (resizeHandler.current) {
			U.Dom.removeEvent(window, 'resize', resizeHandler.current);
		};
		if (sidebarResizeHandler.current) {
			U.Dom.removeEvent(window, 'sidebarResize', sidebarResizeHandler.current);
		};
		resizeHandler.current = null;
		sidebarResizeHandler.current = null;
	};

	const rebind = () => {
		unbind();
		resizeHandler.current = () => resize();
		sidebarResizeHandler.current = () => resize();
		U.Dom.addEvents(window, [
			['resize', resizeHandler.current],
			['sidebarResize', sidebarResizeHandler.current],
		]);
	};

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		resize();	
	});

	useImperativeHandle(ref, () => ({
		update: object => setObject({ ...object }),
		show,
	}));

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				ref={nodeRef} 
				className="layoutPreviewWrapper"
				{...U.Common.animationProps({
					transition: { duration: 0.3, delay: 0.1 },
				})}
			>
				<motion.div
					ref={previewRef} 
					className={cn.join(' ')}
					{...U.Common.animationProps({
						transition: { duration: 0.3, delay: 0.2 },
					})}
				>
					<div className="layoutHeader">
						{!isNote ? (
							<div className="titleWrapper">
								<div className="iconWrapper">
									{icon}
								</div>
								<Title text={name || translate('defaultNamePage')} />
							</div>
						) : ''}

						{withDescription ? <Label text={'Description'} className="description" /> : ''}

						<div className="featured">
							{filtered.map((item, idx) => {
								if (headerRelationsLayout == I.FeaturedRelationLayout.Column) {
									let content: any = null;
									if (item.relationKey == 'type') {
										content = name || translate('defaultNamePage');
									} else {
										content = <EmptyNodes className="item" count={1} />;
									};

									return (
										<dl key={idx} className="featuredColumnItem">
											<dt><Label text={item.name} /></dt>
											<dd>{content}</dd>
										</dl>
									);
								};

								return (
									<div key={idx} className="featuredItem">
										<Label text={item.name} />
										<div className="bullet" />
									</div>
								);
							})}
						</div>
					</div>

					{isFile ? <div className="filePreview" /> : ''}

					{isList ? (
						<div className="listHeader">
							<div className="left">
								<EmptyNodes className="view" count={3} />
							</div>

							<div className="right">
								{[ 'search', 'filter', 'sort', 'settings' ].map((cn, i) => (
									<Icon key={i} className={cn} />
								))}
								<div className="buttonPlug" />
							</div>
						</div>
					) : ''}

					<LayoutPlug
						{...props}
						layoutFormat={layoutFormat}
						recommendedLayout={recommendedLayout}
						recommendedFileRelations={object.recommendedFileRelations}
						viewType={object.defaultViewType}
						layoutWidth={object.layoutWidth}
						isPopup={props.isPopup}
					/>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);

});

export default SidebarLayoutPreview;