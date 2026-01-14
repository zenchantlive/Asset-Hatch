declare module 'pannellum' {
    interface PannellumConfig {
        type: 'equirectangular' | 'cubemap' | 'multires';
        panorama?: string;
        autoLoad?: boolean;
        autoRotate?: number | boolean;
        showControls?: boolean;
        mouseZoom?: boolean;
        draggable?: boolean;
        friction?: number;
        hfov?: number;
        pitch?: number;
        yaw?: number;
    }

    interface PannellumViewer {
        destroy(): void;
        getPitch(): number;
        getYaw(): number;
        getHfov(): number;
        setPitch(pitch: number): void;
        setYaw(yaw: number): void;
        setHfov(hfov: number): void;
    }

    export function viewer(container: HTMLElement, config: PannellumConfig): PannellumViewer;

    const pannellum: {
        viewer: typeof viewer;
    };

    export default pannellum;
}
