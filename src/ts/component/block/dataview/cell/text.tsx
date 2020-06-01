import * as React from 'react';
import { I } from 'ts/lib';
import { Icon, Smile } from 'ts/component';

interface Props extends I.Cell {};

class CellText extends React.Component<Props, {}> {

	render () {
		const { data, relation, view, onOpen } = this.props;

		let content: any = data[relation.id];

		if (relation.id == 'name') {
			let cn = 'c20';
			let size = 18;

			switch (view.type) {
				case I.ViewType.List:
					cn = 'c24';
					break;

				case I.ViewType.Gallery:
				case I.ViewType.Board:
					cn = 'c48';
					size = 24;
					break;
			};

			content = (
				<React.Fragment>
					<Smile id={[ relation.id, data.id ].join('-')} icon={data.iconEmoji} hash={data.iconImage} className={cn} size={size} canEdit={true} offsetY={4} />
					<div className="name">{data[relation.id]}</div>
					<Icon className="expand" onClick={(e: any) => { onOpen(e, data); }} />
				</React.Fragment>
			);
		};

		return (
			<React.Fragment>
				{content}
			</React.Fragment>
		);
	};
	
};

export default CellText;