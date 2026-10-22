import { InstanceMarker } from './instanceMarker.js';
// @ts-ignore - vendor files don't have type declarations
import { Collector } from './vendor/collector.min.mjs';

export interface GameSize {
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
    icon?: {
        width: number;
        height: number;
    };
}

export interface BlipViewport {
    left?: number;
    top?: number;
    safeLeft?: number;
    safeRight?: number;
    safeTop?: number;
    safeBottom?: number;
    width: number;
    height: number;
    x: number;
    y: number;
    zoomX: number;
    zoomY: number;
}

export interface BlipTargetData {
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
}

export interface BlipInput {
    isVisible?: () => boolean;
    getViewport?: () => BlipViewport;
    getTargetData?: (target: any) => BlipTargetData;
}

export interface BlipSettings {
    buffer: number;
    showsDistance: boolean;
    maxDistance: number;
    alwaysOnTop?: boolean;
    input?: BlipInput;
}

export interface IconSettings {
    atlasName: string;
    iconName: string;
}

export interface MarkerSettings {
    showsDistance: boolean;
    removalDistance: number;
}

export interface BlipInstance {
    touchOpacity: number;
    mouseOpacity: number;
    preventAutoScale: boolean;
    anchor: { x: number; y: number };
    atlasName: string;
    iconName: string;
    mapInstance: any;
    screenPos: Point;
    settings: BlipSettings;
    plane?: number;
    layer?: number;
    xIconOffset: number;
    yIconOffset: number;
    angle: number;
    scale?: { x: number; y: number };
    icon?: {
        width: number;
        height: number;
    };
    hide(): void;
    show(): void;
    setPos(x: number, y: number): void;
}

declare global {
    const VYLO: any;
}

export class BlipManagerSingleton {
    /**
     * The size of the game.
     */
    static GAME_SIZE: GameSize = (() => {
        if (VYLO) {
            const gameSize = VYLO.World.getGameSize();
            return gameSize;
        }
        return { 'width': 960, 'height': 540 };
    })();
    
    /**
     * The size of the game halfed.
     */
    static GAME_SIZE_HALF: GameSize = (() => {
        return { 'width': BlipManagerSingleton.GAME_SIZE.width / 2, 'height': BlipManagerSingleton.GAME_SIZE.height / 2 };
    })();
    
    /**
     * The center of the screen's coordinates (in pixels).
     */
    static CENTER_SCREEN_POSITION: Point = (() => {
        return { x: BlipManagerSingleton.GAME_SIZE.width / 2 , y: BlipManagerSingleton.GAME_SIZE.height / 2};
    })();
    
    /**
     * The default tile size. This is used a backup value when an icon's width/height is not accessible.
     */
    static TILE_SIZE = 32;
    
    /**
     * The maximum number of blips that can exist on the screen at once.
     */
    static MAX_BLIPS = 200;
    
    /**
     * An array tracking all stored blips.
     */
    static storedBlips: any[] = [];

    /**
     * Gets the angle between two points.
     * 
     * @param pStartPoint - The starting point.
     * @param pEndPoint - The ending point.
     * @param pCenter - Whether to get the angle from the center of the points.
     * @returns The angle between the starting point and the ending point.
     */
    static getAngle(pStartPoint: Point, pEndPoint: Point, pCenter: boolean): number {
        let y: number;
        let x: number;
        if (pCenter) {
            const iconWidth = pStartPoint.icon ? pStartPoint.icon.width : 32;
            const iconHeight = pStartPoint.icon ? pStartPoint.icon.height : 32;
            y = (pStartPoint.y + iconHeight / 2) - (pEndPoint.y + iconHeight / 2);
            x = (pStartPoint.x + iconWidth / 2) - (pEndPoint.x + iconWidth / 2);
        } else {
            y = pStartPoint.y - pEndPoint.y;
            x = pStartPoint.x - pEndPoint.x;
        }
        return -Math.atan2(y, x) - Math.PI;
    }
    
    /**
     * API to get distance between points.
     * @param pStartPoint - The starting point.
     * @param pEndPoint - The ending point.
     * @param pCenter - Whether to get the distance from the center of the points.
     * @returns The distance between the two points.
     */
    static getDistance(pStartPoint: Point, pEndPoint: Point, pCenter: boolean): number {
        let y: number;
        let x: number;
        if (pCenter) {
            const iconWidth = pStartPoint.icon ? pStartPoint.icon.width : 32;
            const iconHeight = pStartPoint.icon ? pStartPoint.icon.height : 32;
            y = (pStartPoint.y + iconHeight / 2) - (pEndPoint.y + iconHeight / 2);
            x = (pStartPoint.x + iconWidth / 2) - (pEndPoint.x + iconWidth / 2);
        } else {
            y = (pStartPoint.y - pEndPoint.y);
            x = (pStartPoint.x - pEndPoint.x);
        }
        return Math.sqrt(x * x + y * y);
    }
    
    /**
     * Gets the direction of the angle passed.
     * @param pAngle - The angle in radians to convert into a cardinal direction.
     * @returns The direction of the angle.
     */
    static getDirection(pAngle: number): string {
        const degree = Math.abs(Math.floor(((pAngle * (180 / Math.PI)) / 45) + 0.5));
        const compassDirections = ['east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north', 'northeast'];
        return compassDirections[(degree % 8)];
    }
    
    /**
     * The version of the module.
     */
    version = "2.0.0";
    
    /**
     * Whether the manager is actively managing the state of blips.
     */
    paused = false;
    
    /**
     * An array tracking all active blips (hidden or not).
     */
    activeBlips: BlipInstance[] = [];
    
    /**
     * The interface used to handle the blips.
     */
    interfaceHandle: string;
    

    constructor() {
        this.interfaceHandle = 'blip-interface-' + (Math.random() * Math.PI / 2);
        // Create the interface
        VYLO.Client.createInterface(this.interfaceHandle);
        /**
         * Update loop for this blip manager to manage blips.
         */

    }
    
    /**
     * Tracks a blip within the activeBlips array.
     * @param pBlip - The blip to track.
     */
    private frame: number | null = null;
    private tick = (): void => {
        this.frame = null;
        this.manageBlips();
        if (this.activeBlips.length) this.frame = requestAnimationFrame(this.tick);
    };
    track(pBlip: BlipInstance): void {
        if (!this.activeBlips.includes(pBlip)) {
            this.activeBlips.push(pBlip);
            if (this.frame === null) this.frame = requestAnimationFrame(this.tick);
        }
    }
    
    /**
     * Untracks a blip from the activeBlips array.
     * @param pBlip - The blip to untrack.
     */
    untrack(pBlip: BlipInstance): void {
        if (this.activeBlips.includes(pBlip)) {
            this.activeBlips.splice(this.activeBlips.indexOf(pBlip), 1);
            if (!this.activeBlips.length && this.frame !== null) {
                cancelAnimationFrame(this.frame);
                this.frame = null;
                VYLO.Client.hideInterface(this.interfaceHandle);
            }
        }
    }
    
    /**
     * Pauses the blip manager from managing blips
     */
    pause(): void {
        this.paused = true;
    }
    
    /**
     * Resumes the blip manager to manage blips
     */
    resume(): void {
        this.paused = false;
    }
    
    /**
     * Method for updating the "state" of each blip.
     */
    manageBlips(): void {
        // Do not manage blips when paused.
        if (this.paused) {
            return;
        }
        for (const blip of this.activeBlips) {
            const input = blip.settings.input;
            if (input?.isVisible && !input.isVisible()) { blip.hide(); continue; }
            const viewport = input?.getViewport?.() ?? (() => {
                const size = VYLO.World.getGameSize();
                const camera = VYLO.Client.getScreenPos(VYLO.Client.screenPos);
                const zoom = VYLO.Client.mapView.zoom;
                return { ...size, x: camera.x, y: camera.y, zoomX: zoom.x, zoomY: zoom.y };
            })();
            const size = viewport;
            const camera = viewport;
            const zoom = { x: viewport.zoomX, y: viewport.zoomY };
            const target = blip.mapInstance;
            const data = input?.getTargetData?.(target);
            if (data ? !data.active : (!target.mapName || target.collectorCollected || target.dead || target.exploded ||
                target.isCollected || target.removing || target.mapName !== VYLO.Client.mob?.mapName)) {
                blip.hide();
                continue;
            }
            const center = data ?? target.iconPoints?.center?.getPoint(target.angle) ?? {
                x: target.x + (target.icon?.width ?? 32) / 2,
                y: target.y + (target.icon?.height ?? 32) / 2
            };
            const left = viewport.left ?? 0, top = viewport.top ?? 0;
            const x = (center.x - camera.x) * zoom.x + left;
            const y = (center.y - camera.y) * zoom.y + top;
            const halfWidth = (data?.width ?? (target.icon?.width ?? 32) * Math.abs(target.scale?.x ?? 1)) * zoom.x / 2;
            const halfHeight = (data?.height ?? (target.icon?.height ?? 32) * Math.abs(target.scale?.y ?? 1)) * zoom.y / 2;
            const offscreen = x + halfWidth < left || x - halfWidth > left + size.width ||
                y + halfHeight < top || y - halfHeight > top + size.height;
            // Range measures world pixels beyond the viewport, so sonar works at every zoom.
            const distance = Math.hypot(Math.max(0, left - x, x - left - size.width) / zoom.x,
                Math.max(0, top - y, y - top - size.height) / zoom.y);
            // Fit the actual rotated rectangle instead of a rotation-independent
            // circle, which leaves a conspicuous gap at horizontal/vertical edges.
            const halfW = (blip.icon?.width ?? 32) * Math.abs(blip.scale?.x ?? 1) / 2;
            const halfH = (blip.icon?.height ?? 32) * Math.abs(blip.scale?.y ?? 1) / 2;
            const minX = left + blip.settings.buffer + (viewport.safeLeft ?? 0);
            const maxX = left + size.width - blip.settings.buffer - (viewport.safeRight ?? 0);
            const minY = top + blip.settings.buffer + (viewport.safeTop ?? 0);
            const maxY = top + size.height - blip.settings.buffer - (viewport.safeBottom ?? 0);
            let angle = Math.atan2(y - (minY + maxY) / 2, x - (minX + maxX) / 2);
            let markerX = 0, markerY = 0;
            for (let step = 0; step < 24; step++) {
                const extentX = Math.abs(Math.cos(angle)) * halfW + Math.abs(Math.sin(angle)) * halfH;
                const extentY = Math.abs(Math.sin(angle)) * halfW + Math.abs(Math.cos(angle)) * halfH;
                markerX = VYLO.Math.clamp(x, minX + extentX, maxX - extentX);
                markerY = VYLO.Math.clamp(y, minY + extentY, maxY - extentY);
                const next = Math.atan2(y - markerY, x - markerX);
                if (Math.abs(next - angle) < 1e-10) { angle = next; break; }
                angle = next;
            }
            // VYLO adds the source anchor to setPos, even for a centered anchor.
            blip.xIconOffset = -(blip.icon?.width ?? 32) * blip.anchor.x;
            blip.yIconOffset = -(blip.icon?.height ?? 32) * blip.anchor.y;
            blip.setPos(markerX, markerY);
            // Icons point right at zero; VYLO renders positive angles counterclockwise.
            blip.angle = -Math.atan2(y - markerY, x - markerX);
            if (offscreen && distance <= blip.settings.maxDistance) blip.show();
            else blip.hide();
        }
    }
    
    /**
     * Hides all blips
     */
    hideBlips(): void {
        for (const blip of this.activeBlips) {
            blip.hide();
        }
    }
}

// Create an instance of the blip manager 
const BlipManager = new BlipManagerSingleton();

/**
* A Blip Component
* @class BlipComponent
* @version {@2.0.0}
* @license Blip does not have a license at this time. For licensing contact the author
* @author https://github.com/doubleactii
* Copyright (c) 2023 Evitca Studio
*/
export class BlipComponent {
    /**
     * This is the static distance it will be from the side of the game window
     */
    static BUFFER = 25;
    
    /**
     * This is the maximum distance at which the blip will be removed. (Distance from the center of the screen)
     */
    static MAX_DIST = 1000;
    
    /**
     * This is the max plane/layer at which this blip will exist. This will overlay this blip icon over any other interface element
     */
    static MAX_DISPLAY = 9999;
    
    /**
     * The blip instance that is created/recycled. This will be a Diob instance
     */
    instance: BlipInstance | null = null;
    
    /**
     * The interface handle for this blip component
     */
    interfaceHandle!: string;

    /**
     * @param pMapInstance - The instance this blip will represent
     * @param pIconSettings - An object with settings holding the icon information for the blip
     * @param pBlipSettings - AN object with settings on how the blip will behave
     */
    constructor(pMapInstance: any, pIconSettings: IconSettings = { 'atlasName': '', 'iconName': '' }, pBlipSettings: BlipSettings = { 'buffer': BlipComponent.BUFFER, 'showsDistance': false, 'maxDistance': BlipComponent.MAX_DIST, 'alwaysOnTop': false }, pMarkerSettings?: MarkerSettings) {
       // Do not allow more than the max amount of blips to be created.
        if (BlipManager.activeBlips.length >= BlipManagerSingleton.MAX_BLIPS) {
            return;
        }

        // Creating/Recyling the blip
        const blip = Collector.isInCollection('Interface', 1, BlipManagerSingleton.storedBlips);
        blip.touchOpacity = 0;
        blip.mouseOpacity = 0;
        blip.preventAutoScale = false;
        blip.anchor.x = 0.5;
        blip.anchor.y = 0.5;
        // Assigning icon data to the blip
        blip.atlasName = pIconSettings.atlasName;
        blip.iconName = pIconSettings.iconName;
        // Allow map instance to be referenced via the blip
        blip.mapInstance = pMapInstance;
        blip.screenPos = { x: 0, y: 0 };
        blip.settings = {
            // The padding between the blip and the screen
            'input': pBlipSettings.input,
            'buffer': pBlipSettings.buffer,
            // Whether this blip will show its distance
            'showsDistance': pBlipSettings.showsDistance,
            // The max distance at which the map instance this blip represents can be from the center of the screen
            'maxDistance': pBlipSettings.maxDistance
        };
        // Render above all others
        if (pBlipSettings.alwaysOnTop) {
            blip.plane = BlipComponent.MAX_DISPLAY;
            blip.layer = BlipComponent.MAX_DISPLAY;
        }
        
        // Shows a marker when the blip is hidden due to the map instance being ON SCREEN.
        if (pMarkerSettings) {
            /**
             * @todo Create Instance Marker with settings.
             * Remember the atlasName and iconName is inside of the marker settings
             */
        }
        // Adding blip to interface to be shown
        VYLO.Client.addInterfaceElement(blip, BlipManager.interfaceHandle, pMapInstance.id + '- blip');
        blip.hide();
        // Track the blip
        BlipManager.track(blip);
        // Add a reference to the blip
        this.instance = blip;
        // Set the interface handle
        this.interfaceHandle = BlipManager.interfaceHandle;
        // Show the interface if it isn't shown
        if (!VYLO.Client.checkInterfaceShown(this.interfaceHandle)) {
            VYLO.Client.showInterface(this.interfaceHandle);
        }
    }
    
    /**
     * Removes this blip
     */
    remove(): void {
        // We check if there is an instance attached to this blip, because some blips can be created when the max blips already exist and they will be useless
        if (this.instance) {
            this.instance.hide();
            BlipManager.untrack(this.instance);
            this.instance.mapInstance = null;
            Collector.collect(this.instance, BlipManagerSingleton.storedBlips);
            this.instance = null;
        }
    }
}
