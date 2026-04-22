import React, { useState } from 'react';
import Block from '.';
import type { Block as HelpBlock } from 'Docs/help/whatsNew/common';
import * as I from 'Interface';

interface Props {
	block: HelpBlock;
	blockProps: I.Popup;
};

const ToggleBlock = ({ block, blockProps }: Props) => {
	const [ open, setOpen ] = useState(false);
	const onRowClick = () => setOpen(v => !v);
	const items = (('items' in block) && block.items) ? block.items : [];

	return (
		<>
			<Block {...blockProps} {...block} isToggled={open} onRowClick={onRowClick} />
			{open ? (
				<div className="toggleItems">
					{items.map((c, i) => <Block key={i} {...blockProps} {...c} />)}
				</div>
			) : null}
		</>
	);
};

export default ToggleBlock;
