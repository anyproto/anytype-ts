import React, { forwardRef } from 'react';
import { I, J, keyboard, Relation, S, translate, U, sidebar } from 'Lib';
import $ from 'jquery';
import { EmptyNodes, Title } from 'Component';

interface Props {
	layoutFormat: I.LayoutFormat;
	recommendedLayout: I.ObjectLayout;
	recommendedFileRelations?: string[];
	viewType?: I.ViewType;
	layoutWidth?: number;
	isPopup?: boolean;
	onClick?: (e: any) => void;
};

const LayoutPlug = forwardRef<{}, Props>(({
	layoutFormat = I.LayoutFormat.Page,
	recommendedLayout = I.ObjectLayout.Page,
	recommendedFileRelations = [],
	viewType= I.ViewType.Grid,
	layoutWidth = 0,
	isPopup = false,
	onClick,
}, ref) => {

	const getNodeWidth = (): number => {
		const container = U.Common.getPageFlexContainer(isPopup);
		const rightSidebar = S.Common.getRightSidebarState(isPopup);
		const right = rightSidebar.isOpen ? J.Size.sidebar.right : 0;

		return container.width() - right - sidebar.getDummyWidth();
	};

	const getWidth = () => {
		let mw = getNodeWidth();
		let width = 0;

		if (layoutFormat == I.LayoutFormat.List) {
			width = mw - 192;
		} else {
			const size = mw * 0.6;

			mw -= 96;
			width = Math.max(size, Math.min(mw, size + (mw - size) * layoutWidth));
		};

		return Math.max(300, width);
	};

	const onClickHandler = (e: any) => {
		if (onClick) {
			onClick(e);
		};
	};

	const cn = [ 'layoutPlug' ];

	let content: any = null;

	if (U.Object.isInFileLayouts(recommendedLayout)) {
		const fileRelations = Relation.getArrayValue(recommendedFileRelations).map(id => S.Record.getRelationById(id)).filter(it => it);

		cn.push('isFile');
		content = (
			<div className="fileInfo">
				<Title text={translate('commonFileInfo')} />

				{fileRelations.map((relation, idx) => (
					<dl key={idx}>
						<dt>{relation.name}</dt>
						<dd />
					</dl>
				))}
			</div>
		);
	} else
	if (layoutFormat == I.LayoutFormat.Page) {
		cn.push(`layoutFormat${I.LayoutFormat[layoutFormat]}`);
		content = <EmptyNodes className="line" count={5} />;
	} else {
		cn.push(`layoutFormat${I.LayoutFormat[layoutFormat]}`);
		cn.push(`view${I.ViewType[viewType]}`);

		switch (Number(viewType)) {
			case I.ViewType.Board: {
				content = (
					<>
						<div className="group">
							<div className="headerPlug" />
							<EmptyNodes className="item" count={1} />
						</div>

						<div className="group">
							<div className="headerPlug" />
							<EmptyNodes className="item" count={3} />
						</div>

						<div className="group">
							<div className="headerPlug" />
							<EmptyNodes className="item" count={2} />
						</div>
					</>
				);
				break;
			};

			case I.ViewType.Calendar: {
				content = <EmptyNodes className="day" count={28} style={{ height: getWidth() / 7 }} />;
				break;
			};

			default: {
				content = <EmptyNodes className="line" count={5} />;
				break;
			};
		};
	};

	return (
		<div
			className={cn.join(' ')}
			onClick={onClickHandler}
		>
			{content}
		</div>
	);
});

export default LayoutPlug;
