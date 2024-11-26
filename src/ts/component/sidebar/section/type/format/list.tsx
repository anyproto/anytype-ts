import * as React from 'react';
import { observer } from 'mobx-react';
import { Select } from 'Component';
import { I, U, translate } from 'Lib';

const SidebarSectionTypeLayoutFormatList = observer(class SidebarSectionTypeLayoutFormatList extends React.Component<I.SidebarSectionComponent> {

	refDefaultView = null;
	refDefaultType = null;

	render () {
		const { object, onChange } = this.props;

		const defaultViewOptions = U.Menu.prepareForSelect(U.Menu.getViews());
		const defaultTypeOptions = U.Menu.prepareForSelect(U.Data.getObjectTypesForNewObject());

		return (
			<div className="items">
				<div className="item">
					<div className="name">
						{translate('sidebarSectionLayoutDefaultView')}
					</div>

					<div className="value">
						<Select
							ref={ref => this.refDefaultView = ref}
							id={`sidebar-layout-default-view-${object.id}`}
							options={defaultViewOptions}
							value={object.defaultView}
							arrowClassName="light"
							onChange={id => onChange('defaultView', id)}
							menuParam={{
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
						<Select
							ref={ref => this.refDefaultType = ref}
							id={`sidebar-layout-default-type-${object.id}`}
							options={defaultTypeOptions}
							value={object.defaultType}
							arrowClassName="light"
							onChange={id => onChange('defaultType', id)}
							menuParam={{
								horizontal: I.MenuDirection.Right,
							}}
						/>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		this.setValue();
	};

	componentDidUpdate (): void {
		this.setValue();
	};

	setValue () {
		const { object } = this.props;

		this.refDefaultView.setValue(object.defaultView);
		this.refDefaultType.setValue(object.defaultType);
	};
});

export default SidebarSectionTypeLayoutFormatList;
