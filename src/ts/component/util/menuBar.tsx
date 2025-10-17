import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, Renderer, translate } from 'Lib';

const MenuBar = observer(forwardRef<{}, {}>((props, ref) => {

	const { config } = S.Common;
	const cn = [];

	let inner = null;

	if (U.Common.isPlatformWindows() && config.showMenuBar) {
		cn.push('withButtons');
		inner = (
			<>
				<div className="side left">
					<Icon 
						className="window-menu withBackground" 
						tooltipParam={{ text: translate('commonMenu'), typeY: I.MenuDirection.Bottom }} 
						onClick={() => Renderer.send('menu')} 
					/>
					<div className="name">Anytype</div>
				</div>
				<div className="side right">
					<Icon 
						className="window-min withBackground" 
						tooltipParam={{ text: translate('windowMinimize'), typeY: I.MenuDirection.Bottom }} 
						onClick={() => Renderer.send('minimize')} 
					/>

					<Icon 
						className="window-max withBackground" 
						tooltipParam={{ text: translate('windowMaximize'), typeY: I.MenuDirection.Bottom }} 
						onClick={() => Renderer.send('maximize')} 
					/>

					<Icon 
						className="window-close withBackground" 
						tooltipParam={{ text: translate('windowClose'), typeY: I.MenuDirection.Bottom }} 
						onClick={() => Renderer.send('close')} 
					/>
				</div>
			</>
		);
	};

	return (
		<div id="menuBar" className={cn.join(' ')}>
			{inner}
		</div>
	);

}));

export default MenuBar;