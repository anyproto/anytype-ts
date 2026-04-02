import React, { forwardRef } from 'react';
import { Label, Icon } from 'Component';
import Section from 'Component/sidebar/section';
import * as I from 'Interface';

const SidebarPageTableOfContents = forwardRef<{}, I.SidebarPageComponent>((props, ref: any) => {

	const { rootId, isPopup } = props;
	const object = S.Detail.get(rootId, rootId);

	return (
		<>
			<div id="head" className="head">
				<div className="side left">
					<Label text={translate('sidebarToc')} />
				</div>
				<div className="side right">
					<Icon
						name="common/close" withBackground={true}
						onClick={() => sidebar.rightPanelClose(isPopup, true)}
					/>
				</div>
			</div>

			<div id="body" className="body">
				<Section
					{...props}
					id="tableOfContents"
					component="object/tableOfContents"
					object={object}
				/>
			</div>
		</>
	);

});

export default SidebarPageTableOfContents;