import React, { forwardRef, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Select, DragHorizontal } from 'Component';
import { I, U, translate } from 'Lib';

interface Props extends I.SidebarSectionComponent {
	layoutOptions?: any[];
};

const SidebarSectionTypeLayoutFormatPage = observer(forwardRef<{}, Props>((props, ref) => {

	const { object, onChange, layoutOptions, readonly } = props;
	const percentRef = useRef(null);
	const layoutRef = useRef(null);
	const alignRef = useRef(null);
	const featuredRef = useRef(null);
	const widthRef = useRef(null);
	const alignOptions = U.Menu.prepareForSelect(U.Menu.getHAlign([ I.BlockHAlign.Justify ]));
	const featuredViewOptions = U.Menu.prepareForSelect(U.Menu.getFeaturedRelationLayout());
	const snaps = [];

	for (let i = 0; i <= 10; i ++) {
		snaps.push(i / 10);
	};

	useEffect(() => {
		setValue();
	});

	const setValue = () => {
		layoutRef.current.setValue(object.recommendedLayout);
		alignRef.current.setValue(object.layoutAlign);
		featuredRef.current.setValue(object.headerRelationsLayout);
		widthRef.current.setValue(object.layoutWidth);
	};

	const onWidthMove = (v: number) => {
		$(percentRef.current).text(`${getPercent(v)}%`);
	};

	const onWidthEnd = (v: number) => {
		onChange({ layoutWidth: v });
	};

	const getPercent = (v: number): string => {
		v = Number(v) || 0;
		return Math.floor((1 + v) * 100).toString();
	};

	return (
		<div className="items">
			<div className="item">
				<div className="name">
					{translate('sidebarSectionLayoutType')}
				</div>

				<div className="value">
					<Select
						ref={layoutRef}
						id={`sidebar-layout-type-${object.id}`}
						options={layoutOptions}
						value={object.recommendedLayout}
						arrowClassName="light"
						onChange={id => onChange({ recommendedLayout: id })}
						readonly={readonly}
						menuParam={{
							className: 'fixed',
							classNameWrap: 'fromSidebar',
							horizontal: I.MenuDirection.Right,
						}}
					/>
				</div>
			</div>

			<div className="item">
				<div className="name">
					{translate('sidebarSectionLayoutAlign')}
				</div>

				<div className="value">
					<Select
						ref={alignRef}
						id={`sidebar-layout-align-${object.id}`}
						options={alignOptions}
						value={object.layoutAlign}
						arrowClassName="light"
						onChange={id => onChange({ layoutAlign: id })}
						readonly={readonly}
						menuParam={{
							className: 'fixed',
							classNameWrap: 'fromSidebar',
							horizontal: I.MenuDirection.Right,
						}}
					/>
				</div>
			</div>

			<div className="item">
				<div className="name">
					{translate('sidebarSectionFeaturedView')}
				</div>

				<div className="value">
					<Select
						ref={featuredRef}
						id={`sidebar-featured-view-${object.id}`}
						options={featuredViewOptions}
						value={object.headerRelationsLayout}
						arrowClassName="light"
						onChange={id => onChange({ headerRelationsLayout: id })}
						readonly={readonly}
						menuParam={{
							className: 'fixed',
							classNameWrap: 'fromSidebar',
							horizontal: I.MenuDirection.Right,
						}}
					/>
				</div>
			</div>

			<div className="item">
				<div className="name">
					{translate('sidebarSectionLayoutWidth')}
				</div>

				<div className="value flex">
					<div ref={percentRef}>{getPercent(object.layoutWidth)}%</div>
					<DragHorizontal
						ref={widthRef}
						value={object.layoutWidth}
						onMove={(e, v) => onWidthMove(v)}
						onEnd={(e, v) => onWidthEnd(v)}
						readonly={readonly}
						iconIsOutside={false}
						snaps={snaps}
					/>
				</div>
			</div>
		</div>
	);

}));

export default SidebarSectionTypeLayoutFormatPage;