import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Label, TabSwitch } from 'Component';
import { I, U, translate } from 'Lib';

import FormatPage from './format/page';
import FormatList from './format/list';

const Components = [
	FormatPage,
	FormatList,
];

const SidebarSectionTypeLayout = observer(forwardRef<I.SidebarSectionRef, I.SidebarSectionComponent>((props, ref) => {
	
	const { object, readonly, onChange } = props;
	const formatOptions: I.Option[] = [
		{ id: I.LayoutFormat.Page, name: translate('sidebarSectionLayoutFormatPage') },
		{ id: I.LayoutFormat.List, name: translate('sidebarSectionLayoutFormatList') },
	];
	const nodeRef = useRef(null);
	const formatRef = useRef(null);
	const [ dummy, setDummy ] = useState(0);
	const Component = Components[object.layoutFormat];

	const setValue = () => {
		formatRef.current?.setValue(object.layoutFormat);
	};

	const onLayout = (id: I.LayoutFormat) => {
		const layoutOptions = getLayoutOptions(id);

		if (!layoutOptions.length) {
			return;
		};

		onChange({ layoutFormat: id, recommendedLayout: layoutOptions[0].id });
	};

	const getLayoutOptions = (format: I.LayoutFormat): any[] => {
		let ret = [];

		if (readonly) {
			ret = [ object.recommendedLayout ];
		} else {
			switch (format) {
				case I.LayoutFormat.Page: {
					ret = [
						I.ObjectLayout.Page,
						I.ObjectLayout.Human,
						I.ObjectLayout.Task,
						I.ObjectLayout.Note,
					];

					if (!object.isNew && U.Object.isBookmarkLayout(object.recommendedLayout)) {
						ret = [ I.ObjectLayout.Bookmark ];
					};
					break;
				};

				case I.LayoutFormat.List: {
					ret = [ I.ObjectLayout.Collection ];			
					break;
				};
			};
		};

		return ret.map(id => {
			return {
				id,
				icon: U.Menu.getLayoutIcon(id),
				name: translate(`layout${id}`),
			};
		});
	};

	useEffect(() => {
		setValue();
	});

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
	}));

	return (
		<div ref={nodeRef} className="wrap">
			{!object.id ? (
				<>
					<Label text={translate('sidebarSectionLayoutFormat')} />
					<div className="items">
						<div className="item">
							<TabSwitch
								ref={formatRef}
								options={formatOptions}
								value={object.layoutFormat}
								onChange={onLayout}
								readonly={readonly}
							/>
						</div>
					</div>
				</>
			) : ''}

			<Label text={translate('sidebarSectionLayoutName')} />

			{Component ? <Component {...props} layoutOptions={getLayoutOptions(object.layoutFormat)} /> : ''}
		</div>
	);

}));

export default SidebarSectionTypeLayout;