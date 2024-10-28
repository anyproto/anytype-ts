import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Select, Drag } from 'Component';
import { I, U, translate } from 'Lib';

const SidebarSectionLayout = observer(class SidebarSectionTitle extends React.Component<I.SidebarSectionComponent> {
	
	node = null;

    render () {
		const { object } = this.props;
		const layoutOptions = U.Menu.prepareForSelect(U.Menu.turnLayouts());
		const alignOptions = U.Menu.prepareForSelect(U.Menu.getHAlign([ I.BlockHAlign.Justify ]));
		const percent = (1 + object.layoutWidth) * 100;

        return (
			<div 
				ref={ref => this.node = ref}
				className="section sectionLayout"
			>
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
								arrowClassName="light"
								menuParam={{
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
								id={`sidebar-layout-align-${object.id}`} 
								options={alignOptions}
								value={object.layoutAlign} 
								arrowClassName="light"
								menuParam={{
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
							<div id="percent">{percent}%</div>
							<Drag 
								value={object.layoutWidth}
								onMove={(e, v) => this.onWidthMove(v)}
								onEnd={(e, v) => this.onWidthEnd(v)}
								iconIsOutside={false}
							/>
						</div>
					</div>
				</div>
			</div>
		);
    };

	onWidthMove (v: number) {
		const node = $(this.node);

		node.find('#percent').text(`${U.Common.sprintf('%0.2f', (1 + v) * 100)}%`);
	};

	onWidthEnd (v: number) {
		console.log('onWidthEnd', v);
	};

});

export default SidebarSectionLayout;