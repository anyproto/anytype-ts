import React, { forwardRef, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Select, Switch } from 'Component';
import { I, U, translate } from 'Lib';

interface Props extends I.SidebarSectionComponent {
	layoutOptions?: any[];
};

const SidebarSectionTypeLayoutFormatPage = observer(forwardRef<{}, Props>((props, ref) => {

	const { object, onChange, layoutOptions, readonly } = props;
	const layoutRef = useRef(null);
	const alignRef = useRef(null);
	const featuredRef = useRef(null);
	const alignOptions = U.Menu.getHAlign([ I.BlockHAlign.Justify ]);
	const featuredViewOptions = U.Menu.getFeaturedRelationLayout();

	useEffect(() => {
		setValue();
	});

	const setValue = () => {
		layoutRef.current.setValue(object.recommendedLayout);
		alignRef.current.setValue(object.layoutAlign);
		featuredRef.current.setValue(object.headerRelationsLayout);
	};

	const onFullWidthChange = (e: any, v: boolean) => {
		onChange({ layoutWidth: v ? 1 : 0 });
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
					{translate('sidebarSectionFullWidth')}
				</div>

				<div className="value">
					<Switch
						className="big"
						value={object.layoutWidth == 1}
						onChange={onFullWidthChange}
						readonly={readonly}
					/>
				</div>
			</div>
		</div>
	);

}));

export default SidebarSectionTypeLayoutFormatPage;