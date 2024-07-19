import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject } from 'Component';
import { U } from 'Lib';

interface Props {
	id: string;
	isButton: boolean;
	onClick: (e: any) => void;
	onMouseEnter: (e: any) => void;
	onMouseLeave: () => void;
	onContextMenu: (e: any) => void;
};

const VaultItem = observer(class Vault extends React.Component<Props> {
	
    render () {
		const { id, isButton, onClick, onMouseEnter, onMouseLeave, onContextMenu } = this.props;
		const cn = [ 'item' ];

		let icon = null;

		if (!isButton) {
			const object = U.Menu.getVaultItems().find(it => it.id == id);
			icon = <IconObject object={object} size={56} forceLetter={true} />;
		} else {
			cn.push(`isButton ${id}`);
		};

        return (
            <div 
				id={`item-${id}`}
				className={cn.join(' ')}
				onClick={onClick}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				onContextMenu={onContextMenu}
			>
				<div className="iconWrap">
					{icon}
				</div>
			</div>
		);
    };

});

export default VaultItem;