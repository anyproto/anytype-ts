import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Title, Label, Checkbox, Icon, IconObject, EmptyNodes, LayoutPlug } from 'Component';
import { I, S, U, J, Relation, translate, sidebar } from 'Lib';

interface RefProps {
	update: (object: any) => void;
	show: (v: boolean) => void;
};

const SidebarLayoutPreview = observer(forwardRef<RefProps, I.SidebarPageComponent>((props, ref) => {

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
	const ns = `sidebarPreview${U.Common.getEventNamespace(isPopup)}`;

	const show = (v: boolean) => {
		resize();

		window.clearTimeout(timeoutRef.current);
		timeoutRef.current = window.setTimeout(() => {
			const node = $(nodeRef.current);

			node.removeClass('in out');
			v ? node.addClass('in') : node.addClass('out');
			node.toggleClass('show', v);
		}, 40);
	};

	const getNodeSize = (): { width: number; height: number } => {
		const container = U.Common.getPageFlexContainer(isPopup);
		const sidebarLeft = sidebar.leftPanelGetNode();
		const sidebarRight = sidebar.rightPanelGetNode(isPopup);

		return {
			width: container.width() - sidebarLeft.outerWidth() - sidebarRight.outerWidth() - 9,
			height: container.height(),
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

		$(nodeRef.current).css(size);
		$(previewRef.current).css({ width: w });
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
			icon = <Checkbox readonly={true} value={false} />;
		} else
		if (isHuman) {
			icon = <IconObject object={{ name, layout: recommendedLayout }} size={96} />;
		} else {
			icon = <Icon key={`sidebar-preview-icon-${layoutFormat}`} />;
		};
	};

	const unbind = () => {
		$(window).off(`resize.${ns} sidebarResize.${ns}`);
	};

	const rebind = () => {
		unbind();
		$(window).on(`resize.${ns} sidebarResize.${ns}`, () => resize());
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
		<div ref={nodeRef} className="layoutPreviewWrapper">
			<div ref={previewRef} className={cn.join(' ')}>
				<div className="layoutHeader">
					{!isNote ? (
						<div className="titleWrapper">
							{icon}
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
			</div>
		</div>
	);

}));

export default SidebarLayoutPreview;