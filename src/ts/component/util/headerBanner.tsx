import * as React from 'react';
import $ from 'jquery';
import { IconObject, Label, ObjectName } from 'Component';
import { I, Action, translate, UtilObject } from 'Lib';
import { dbStore } from 'Store';

interface Props {
	type: I.BannerType;
	object: any;
};

class HeaderBanner extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	render () {
		const { type, object } = this.props;

		let label = '';
		let target = null;
		let action = null;

		switch (type) {
			case I.BannerType.IsArchived: {
				label = translate('deletedBanner');
				action = <div className="action" onClick={e => Action.restore([ object.id ])}>{translate('deletedBannerRestore')}</div>;
				break;
			};

			case I.BannerType.IsTemplate: {
				const targetObjectType = dbStore.getTypeById(object.targetObjectType);

				label = translate('templateBannner');
				if (targetObjectType) {
					target = (
						<div className="typeName" onClick={() => UtilObject.openAuto(targetObjectType)}>
							{translate('commonOf')}
							<IconObject size={18} object={targetObjectType} />
							<ObjectName object={targetObjectType} />
						</div>
					);
				};
				break;
			};

			case I.BannerType.TemplateSelect: {
				break;
			};
		};

		return (
			<div
				ref={node => this.node = node}
				className="headerBanner"
			>
				<div className="content">
					<Label text={label} />
					{target}
				</div>

				{action}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

};

export default HeaderBanner;
