import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Select } from 'Component';
import { I, U, translate } from 'Lib';

const SidebarSectionLayout = observer(class SidebarSectionTitle extends React.Component<I.SidebarSectionComponent> {
	
    render () {
		const { object } = this.props;
		const layoutOptions = U.Menu.prepareForSelect(U.Menu.turnLayouts());
		const alignOptions = U.Menu.prepareForSelect(U.Menu.getHAlign([ I.BlockHAlign.Justify ]));

        return (
			<div className="section sectionLayout">
				<Label text={translate('sidebarSectionLayoutName')} />

				<div className="items">
					<div className="item">
						<div className="name">
							{translate('sidebarSectionLayoutType')}
						</div>

						<div className="value">
							<Select 
								id={`sidebar-layout-type-${object.id}`} 
								options={layoutOptions}
								value={object.recommendedLayout} 
							/>
						</div>
					</div>

					<div className="item">
						<div className="name">
							{translate('sidebarSectionLayoutAlign')}
						</div>

						<div className="value">
							<Select 
								id={`sidebar-layout-align-${object.id}`} 
								options={alignOptions}
								value={object.layoutAlign} 
							/>
						</div>
					</div>

					<div className="item">
						<div className="name">
							{translate('sidebarSectionLayoutWidth')}
						</div>

						<div className="value">
						</div>
					</div>
				</div>
			</div>
		);
    };

});

export default SidebarSectionLayout;