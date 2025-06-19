import * as React from 'react';
import { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Label, Icon } from 'Component';
import { I, S, translate, sidebar } from 'Lib';
import Section from 'Component/sidebar/section';

const SidebarPageTableOfContents = observer(forwardRef<{}, I.SidebarPageComponent>((props, ref: any) => {

	const { rootId, isPopup } = props;
	const object = S.Detail.get(rootId, rootId);

	return (
		<>
			<div className="head">
				<div className="side left">
					<Label text={translate('sidebarToc')} />
				</div>
				<div className="side right">
					<Icon className="close withBackground" onClick={() => sidebar.rightPanelToggle(true, isPopup)} />
				</div>
			</div>

			<div className="body">
				<Section
					{...props}
					id="tableOfContents"
					component="object/tableOfContents"
					rootId={rootId}
					object={object}
				/>
			</div>
		</>
	);

}));

export default SidebarPageTableOfContents;