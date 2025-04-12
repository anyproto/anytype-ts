import React from 'react';
import { Icon } from 'Component';
import { Renderer } from 'Lib';

interface Props {
    showMenu?: boolean;
}

const HeaderTitlebar = (props: Props) => {
    const { showMenu } = props;

    const onMenu = () => {
        Renderer.send('winCommand', 'menu');
    };

    const onMinimize = () => {
        Renderer.send('winCommand', 'minimize');
    };

    const onMaximize = () => {
        Renderer.send('winCommand', 'maximize');
    };

    const onClose = () => {
        Renderer.send('winCommand', 'close');
    };

    return (
        <div className="titlebar">
            {showMenu && (
                <div className="menuButton" onClick={onMenu}>
                    <Icon className="menu" />
                </div>
            )}
            <div className="dragRegion" />
            <div className="windowControls">
                <div className="button minimize" onClick={onMinimize}>
                    <Icon className="minimize" />
                </div>
                <div className="button maximize" onClick={onMaximize}>
                    <Icon className="maximize" />
                </div>
                <div className="button close" onClick={onClose}>
                    <Icon className="close" />
                </div>
            </div>
        </div>
    );
};

export default HeaderTitlebar; 