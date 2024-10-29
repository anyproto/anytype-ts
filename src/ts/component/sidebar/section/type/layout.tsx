import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Select, Drag } from 'Component';
import { I, U, translate } from 'Lib';

const SidebarSectionTypeLayout = observer(class SidebarSectionTypeLayout extends React.Component<I.SidebarSectionComponent> {
	
	node = null;
	refLayout = null;
	refAlign = null;
	refWidth = null;

    render () {
		const { object, onChange } = this.props;
		const layoutOptions = U.Menu.prepareForSelect(U.Menu.turnLayouts());
		const alignOptions = U.Menu.prepareForSelect(U.Menu.getHAlign([ I.BlockHAlign.Justify ]));
		const percent = (1 + object.layoutWidth) * 100;

        return (
			<div ref={ref => this.node = ref} className="wrap">
				<Label text={translate('sidebarSectionLayoutName')} />

				<div className="items">
					<div className="item">
						<div className="name">
							{translate('sidebarSectionLayoutType')}
						</div>

						<div className="value">
							<Select 
								ref={ref => this.refLayout = ref}
								id={`sidebar-layout-type-${object.id}`} 
								options={layoutOptions}
								value={object.recommendedLayout} 
								arrowClassName="light"
								onChange={id => onChange('recommendedLayout', id)}
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
								ref={ref => this.refAlign = ref}
								id={`sidebar-layout-align-${object.id}`} 
								options={alignOptions}
								value={object.layoutAlign} 
								arrowClassName="light"
								onChange={id => onChange('layoutAlign', id)}
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
								ref={ref => this.refWidth = ref}
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

	componentDidMount (): void {
		this.setValue();
	};

	componentDidUpdate (): void {
		this.setValue();
	};

	setValue () {
		const { object } = this.props;

		this.refLayout.setValue(object.recommendedLayout);
		this.refAlign.setValue(object.layoutAlign);
		this.refWidth.setValue(object.layoutWidth);
	};

	onWidthMove (v: number) {
		$(this.node).find('#percent').text(`${U.Common.sprintf('%0.2f', (1 + v) * 100)}%`);
	};

	onWidthEnd (v: number) {
		this.props.onChange('layoutWidth', v);
	};

});

export default SidebarSectionTypeLayout;