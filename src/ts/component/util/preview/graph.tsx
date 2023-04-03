import * as React from 'react';
import {ObjectName, ObjectDescription, IconObject} from 'Component';
import { dbStore } from 'Store';
import { translate, Util } from 'Lib';
import { observer } from 'mobx-react';

interface Props {
	object: any;
};

const PreviewGraph = observer(class PreviewGraph extends React.Component<Props> {
	
	render () {
		const { object } = this.props;
		const type = dbStore.getType(object.type);

		let typeObj = null;
		if (type) {
			if (type.isDeleted) {
				typeObj = <span className="textColor-red">{translate('commonDeletedType')}</span>;
			} else {
				typeObj = Util.shorten(type.name, 32);
			};
		};

		return (
			<div className="previewGraph">
				<div className="previewHeader">
					<IconObject size={20} iconSize={18} object={object} />
					<ObjectName object={object} />
				</div>
				<ObjectDescription object={object} />
				<div className="featured">{typeObj}</div>
			</div>
		);
	};

});

export default PreviewGraph;