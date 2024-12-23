import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, TabSwitch } from 'Component';
import { I, translate } from 'Lib';

import FormatPage from './format/page';
import FormatList from './format/list';

const Components = {
	0: FormatPage,
	1: FormatList,
};

const SidebarSectionTypeLayout = observer(class SidebarSectionTypeLayout extends React.Component<I.SidebarSectionComponent> {
	
	node = null;
	refFormat = null;

	constructor (props: I.SidebarSectionComponent) {
		super(props);

		this.onLayout = this.onLayout.bind(this);
	};

    render () {
		const { object } = this.props;
		const formatOptions: I.Option[] = [
			{ id: I.LayoutFormat.Page, name: translate('sidebarSectionLayoutFormatPage') },
			{ id: I.LayoutFormat.List, name: translate('sidebarSectionLayoutFormatList') },
		];
		const Component = Components[object.layoutFormat];

        return (
			<div ref={ref => this.node = ref} className="wrap">
				{!object.id ? (
					<React.Fragment>
						<Label text={translate('sidebarSectionLayoutFormat')} />
						<div className="items">
							<div className="item">
								<TabSwitch
									ref={ref => this.refFormat = ref}
									options={formatOptions}
									value={object.layoutFormat}
									onChange={this.onLayout}
								/>
							</div>
						</div>
					</React.Fragment>
				) : ''}

				<Label text={translate('sidebarSectionLayoutName')} />

				{Component ? <Component {...this.props} /> : ''}
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

		this.refFormat?.setValue(object.layoutFormat);
	};

	onLayout (id: string): void {
		this.props.onChange({ 
			layoutFormat: id, 
			recommendedLayout: id == 'list' ? I.ObjectLayout.Collection : I.ObjectLayout.Page,
		});
	};

});

export default SidebarSectionTypeLayout;
