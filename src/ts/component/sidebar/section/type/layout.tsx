import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, TabSwitch } from 'Component';
import { I, U, translate } from 'Lib';

import FormatPage from './format/page';
import FormatList from './format/list';

const Components = [
	FormatPage,
	FormatList,
];

const SidebarSectionTypeLayout = observer(class SidebarSectionTypeLayout extends React.Component<I.SidebarSectionComponent> {
	
	node = null;
	refFormat = null;

	constructor (props: I.SidebarSectionComponent) {
		super(props);

		this.onLayout = this.onLayout.bind(this);
	};

    render () {
		const { object, readonly } = this.props;
		const formatOptions: I.Option[] = [
			{ id: I.LayoutFormat.Page, name: translate('sidebarSectionLayoutFormatPage') },
			{ id: I.LayoutFormat.List, name: translate('sidebarSectionLayoutFormatList') },
		];
		const Component = Components[object.layoutFormat];

        return (
			<div ref={ref => this.node = ref} className="wrap">
				{!object.id ? (
					<>
						<Label text={translate('sidebarSectionLayoutFormat')} />
						<div className="items">
							<div className="item">
								<TabSwitch
									ref={ref => this.refFormat = ref}
									options={formatOptions}
									value={object.layoutFormat}
									onChange={this.onLayout}
									readonly={readonly}
								/>
							</div>
						</div>
					</>
				) : ''}

				<Label text={translate('sidebarSectionLayoutName')} />

				{Component ? <Component {...this.props} layoutOptions={this.getLayoutOptions(object.layoutFormat)} /> : ''}
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

	onLayout (id: I.LayoutFormat): void {
		const layoutOptions = this.getLayoutOptions(id);

		this.props.onChange({ 
			layoutFormat: id, 
			recommendedLayout: layoutOptions[0].id,
		});
	};

	getLayoutOptions (format: I.LayoutFormat): any[] {
		const { object, readonly } = this.props;

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

		return U.Menu.prepareForSelect(ret.map(id => {
			return {
				id,
				icon: U.Menu.getLayoutIcon(id),
				name: translate(`layout${id}`),
			};
		}));
	};

});

export default SidebarSectionTypeLayout;
