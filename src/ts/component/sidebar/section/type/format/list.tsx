import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Select } from 'Component';
import { I, U, translate, S, J } from 'Lib';

interface Props extends I.SidebarSectionComponent {
	layoutOptions?: any[];
};

const SidebarSectionTypeLayoutFormatList = observer(class SidebarSectionTypeLayoutFormatList extends React.Component<Props> {

	refDefaultView = null;

	constructor (props: Props) {
		super(props);

		this.onType = this.onType.bind(this);
	};

	render () {
		const { object, onChange, readonly } = this.props;
		const defaultViewOptions = U.Menu.getViews().filter(it => it.id != I.ViewType.Graph);
		const type = S.Record.getTypeById(object.defaultTypeId);

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
							onClick={this.onType}
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
	};

	componentDidMount (): void {
		this.setValue();
	};

	componentDidUpdate (): void {
		this.setValue();
	};

	onType () {
		const { object, onChange, readonly } = this.props;
		
		if (readonly) {
			return;
		};

		S.Menu.open('typeSuggest', {
			element: `#sidebar-layout-default-type-${object.id}`,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			horizontal: I.MenuDirection.Right,
			data: {
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

	setValue () {
		this.refDefaultView.setValue(String(this.props.object.defaultViewType));
	};
});

export default SidebarSectionTypeLayoutFormatList;
