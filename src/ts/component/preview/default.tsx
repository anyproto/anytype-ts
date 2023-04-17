import * as React from 'react';
import { ObjectName, ObjectDescription, IconObject } from 'Component';
import { dbStore } from 'Store';
import { translate, Util } from 'Lib';
import { observer } from 'mobx-react';

interface Props {
	object: any;
	className?: string;
};

const PreviewDefault = observer(class PreviewDefault extends React.Component<Props> {
	
	render () {
		const { object, className } = this.props;
		const type = dbStore.getType(object.type);
		const cn = [ 'previewDefault' ];

		cn.push(className);

		let typeObj = null;
		if (type) {
			if (type.isDeleted) {
				typeObj = <span className="textColor-red">{translate('commonDeletedType')}</span>;
			} else {
				typeObj = Util.shorten(type.name, 32);
			};
		};

		return (
			<div className={cn.join(' ')}>
				<div className="previewHeader">
					<IconObject object={object} />
					<ObjectName object={object} />
				</div>
				<ObjectDescription object={object} />
				<div className="featured">{typeObj}</div>
			</div>
		);
	};

});

export default PreviewDefault;