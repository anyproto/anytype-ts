import * as React from 'react';
import { ObjectName, ObjectDescription } from 'Component';
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

		return (
			<div className="previewGraph">
				<ObjectName object={object} />
				<ObjectDescription object={object} />

				<div className="featured">
					{type && !type.isDeleted ? Util.shorten(type.name, 32) : (
						<span className="textColor-red">
							{translate('commonDeletedType')}
						</span>
					)}
					<div className="bullet" />
				</div>
			</div>
		);
	};

});

export default PreviewGraph;