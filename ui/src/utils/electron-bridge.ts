export const handleQuit = () => {
    window.electronAPI.quitApp();
};

export const handleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().then();
        }
    }
};

export const handleToggleDev = () => {
    window.electronAPI.toggleDevTools();
};

export const handleHelp = () => {
    window.electronAPI.help();
}