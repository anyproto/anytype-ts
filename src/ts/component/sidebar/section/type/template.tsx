import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Title, Icon } from 'Component';
import { I, translate } from 'Lib';

const SidebarSectionTypeTemplate = observer(forwardRef<{}, I.SidebarSectionComponent>((props, ref) => {

	const onAdd = () => {
	};

	return (
		<div 
			className="wrap"
		>
			<div className="titleWrap">
				<Title text={translate('commonTemplates')} />
				<Icon 
					id="section-relation-plus" 
					className="plus withBackground" 
					tooltipParam={{ text: translate('commonAddTemplate') }}
					onClick={e => onAdd()} 
				/>
			</div>

		</div>
	);

}));

export default SidebarSectionTypeTemplate;