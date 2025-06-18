import * as React from 'react';
import { observer } from 'mobx-react';
import { Select, DragHorizontal } from 'Component';
import { I, U, translate } from 'Lib';

interface Props extends I.SidebarSectionComponent {
	layoutOptions?: any[];
};

const SidebarSectionTypeLayoutFormatPage = observer(class SidebarSectionTypeLayoutFormatPage extends React.Component<Props> {

	node = null;
	refLayout = null;
	refAlign = null;
	refFeaturedView = null;
	refWidth = null;

	render () {
		const { object, onChange, layoutOptions, readonly } = this.props;
		const alignOptions = U.Menu.prepareForSelect(U.Menu.getHAlign([ I.BlockHAlign.Justify ]));
		const featuredViewOptions = U.Menu.prepareForSelect(U.Menu.getFeaturedRelationLayout());
		const snaps = [];

		for (let i = 0; i <= 10; i ++) {
			snaps.push(i / 10);
		};

		return (
			<div ref={node => this.node = node} className="items">
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
							ref={ref => this.refAlign = ref}
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
							ref={ref => this.refFeaturedView = ref}
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
						<div id="percent">{this.getPercent(object.layoutWidth)}%</div>
						<DragHorizontal
							ref={ref => this.refWidth = ref}
							value={object.layoutWidth}
							onMove={(e, v) => this.onWidthMove(v)}
							onEnd={(e, v) => this.onWidthEnd(v)}
							readonly={readonly}
							iconIsOutside={false}
							snaps={snaps}
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

		this.refLayout?.setValue(object.recommendedLayout);
		this.refAlign?.setValue(object.layoutAlign);
		this.refFeaturedView?.setValue(object.headerRelationsLayout);
		this.refWidth?.setValue(object.layoutWidth);
	};

	onWidthMove (v: number) {
		$(this.node).find('#percent').text(`${this.getPercent(v)}%`);
	};

	onWidthEnd (v: number) {
		this.props.onChange({ layoutWidth: v });
	};

	getPercent (v: number): string {
		v = Number(v) || 0;
		return Math.floor((1 + v) * 100).toString();
	};
});

export default SidebarSectionTypeLayoutFormatPage;
