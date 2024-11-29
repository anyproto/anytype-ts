import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, TabSwitch } from 'Component';
import { I, U, translate } from 'Lib';

import FormatPage from './format/page';
import FormatList from './format/list';

const Components = {
	'page': FormatPage,
	'list': FormatList,
};

const SidebarSectionTypeLayout = observer(class SidebarSectionTypeLayout extends React.Component<I.SidebarSectionComponent> {
	
	node = null;
	refFormat = null;

    render () {
		const { object, onChange } = this.props;
		const formatOptions: I.Option[] = [
			{ id: 'page', name: translate('sidebarSectionLayoutFormatPage') },
			{ id: 'list', name: translate('sidebarSectionLayoutFormatList') },
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
									onChange={id => onChange({ layoutFormat: id })}
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

});

export default SidebarSectionTypeLayout;
