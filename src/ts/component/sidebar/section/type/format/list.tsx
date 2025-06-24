import React, { forwardRef, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Icon, Select } from 'Component';
import { I, U, translate, S, J } from 'Lib';

interface Props extends I.SidebarSectionComponent {
	layoutOptions?: any[];
};

const SidebarSectionTypeLayoutFormatList = observer(forwardRef<{}, Props>((props, ref) => {

	const viewRef = useRef(null);
	const { object, onChange, readonly } = props;
	const defaultViewOptions = U.Menu.getViews().filter(it => it.id != I.ViewType.Graph);
	const type = S.Record.getTypeById(object.defaultTypeId);

	const onType = () => {
		if (readonly) {
			return;
		};

		S.Menu.open('typeSuggest', {
			element: `#sidebar-layout-default-type-${object.id}`,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			horizontal: I.MenuDirection.Right,
			data: {
				canAdd: true,
				filter: '',
				filters: [
					{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
					{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
				],
				onClick: (item: any) => {
					onChange({ defaultTypeId: item.id });
				},
			}
		});
	};

	const setValue = () => {
		viewRef.current.setValue(String(object.defaultViewType));
	};

	useEffect(() => setValue());

	return (
		<div className="items">
			<div className="item">
				<div className="name">
					{translate('sidebarSectionLayoutDefaultView')}
				</div>

				<div className="value">
					<Select
						ref={viewRef}
						id={`sidebar-layout-default-view-${object.id}`}
						options={defaultViewOptions}
						value={object.defaultViewType}
						arrowClassName="light"
						onChange={id => onChange({ defaultViewType: id })}
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
					{translate('sidebarSectionLayoutDefaultType')}
				</div>

				<div className="value">
					<div 
						id={`sidebar-layout-default-type-${object.id}`} 
						className={[ 'select', (readonly ? 'isReadonly' : '') ].join(' ')} 
						onClick={onType}
					>
						<div className="item">
							<div className="name">{type?.name || translate('commonSelect')}</div>
						</div>
						<Icon className="arrow light" />
					</div>
				</div>
			</div>
		</div>
	);

}));

export default SidebarSectionTypeLayoutFormatList;