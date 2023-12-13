import { InstanceMarker } from './instanceMarker.mjs';
import { Logger } from './vendor/logger.min.mjs';
import { Collector } from './vendor/collector.min.mjs';

class BlipManagerSingleton {
    /**
     * The size of the game
     * @type {number}
     */
	static GAME_SIZE = (() => {
		if (VYLO) {
			const gameSize = VYLO.World.getGameSize();
			return gameSize;
		}
		return { 'width': 960, 'height': 540 };
	})();
    /**
     * The size of the game halfed
     * @type {number}
     */
	static GAME_SIZE_HALF = (() => {
		return { 'width': BlipManagerSingleton.GAME_SIZE.width / 2, 'height': BlipManagerSingleton.GAME_SIZE.height / 2 };
	})();
    /**
     * The center of the screen's coordinates (in pixels)
     * @type {number}
     */
    static CENTER_SCREEN_POSITION = (() => {
        return { x: BlipManagerSingleton.GAME_SIZE.width / 2 , y: BlipManagerSingleton.GAME_SIZE.height / 2};
	})();
    /**
     * The default tile size. This is used a backup value when an icon's width/height is not accessible.
     * @type {number}
     */
    static TILE_SIZE = 32;
    /**
     * The maximum number of blips that can exist on the screen at once
     * @type {number}
     */
    static MAX_BLIPS = 200;
    /**
     * An array tracking all stored blips
     * @type {Array}
     */
    static storedBlips = [];
	/**
	 * Gets the angle between two points
	 * 
	 * @param {Object} pStartPoint - The starting point
	 * @param {Object} pEndPoint - The ending point
     * @param {boolean} pCenter - Whether to get the angle from the center of the points
	 * @returns {number} The angle between the starting point and the ending point
	 */
	static getAngle(pStartPoint, pEndPoint, pCenter) {
        let y;
        let x;
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
     * API to get distance between points
     * @param {Object} pStartPoint - The starting point
     * @param {Object} pEndPoint - The ending point
     * @param {boolean} pCenter - Whether to get the distance from the center of the points
     * @returns {number} The distance between the two points
     */
    static getDistance(pStartPoint, pEndPoint, pCenter) {
        let y;
        let x;
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
     * Gets the direction of the angle passed
     * @param {number} pAngle - The angle in radians to convert into a cardinal direction
     * @returns The direction of the angle
     */
    static getDirection(pAngle) {
		const degree = Math.abs(Math.floor(((pAngle * (180 / Math.PI)) / 45) + 0.5));
		const compassDirections = ['east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north', 'northeast'];
		return compassDirections[(degree % 8)];
	}
    /**
     * Whether the manager is actively managing the state of blips
     * @type {boolean}
     */
    paused = false;
    /**
     * An array tracking all active blips (hidden or not)
     * @type {Array}
     */
    activeBlips = [];

    constructor() {
        this.interfaceHandle = (Math.random() * Math.PI / 2) + '-blip-interface';
        // Create a logger
        /** The logger module this module uses to log errors / logs
         * @private
         * @type {Object}
         */
        this.logger = new Logger();
        this.logger.registerType('BlipComponent-Module', this.logger.FG_MAGENTA);
        this.logger.prefix('BlipComponent-Module').log(`✅@v${__VERSION__}`);
        // Create the interface
        VYLO.Client.createInterface(this.interfaceHandle);
        // Show the interface
        VYLO.Client.showInterface(this.interfaceHandle);
        /**
         * Update loop for this blip manager to manage blips
         */
        const self = this;
        const update = function() {
            self.manageBlips();
            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
    /**
     * Tracks a blip within the activeBlips array
     * @param {Object} pBlip - The blip to track
     */
    track(pBlip) {
        if (!this.activeBlips.includes(pBlip)) {
            this.activeBlips.push(pBlip);
        }
    }
    /**
     * Untracks a blip from the activeBlips array
     * @param {Object} pBlip - The blip to untrack
     */
    untrack(pBlip) {
        if (this.activeBlips.includes(pBlip)) {
            this.activeBlips.splice(this.activeBlips.indexOf(pBlip), 1);
        }
    }
    /**
     * Pauses the blip manager from managing blips
     */
    pause() {
        this.paused = true;
    }
    /**
     * Resumes the blip manager to manage blips
     */
    resume() {
        this.paused = false;
    }
    /**
     * Method for updating the "state" of each blip
     */
    manageBlips() {
        // Do not manage blips when paused.
        if (this.paused) {
            return;
        }
        for (const blip of this.activeBlips) {
            const blipIconWidth = blip.icon ? blip.icon.width : 32;
            const blipIconHeight = blip.icon ? blip.icon.height : 32;

            const mapInstanceIconWidth = blip.mapInstance.icon ? blip.mapInstance.icon.width : 32;
            const mapInstanceHeight = blip.mapInstance.icon ? blip.mapInstance.icon.height : 32;
            blip.mapInstance.getScreenPos(blip.screenPos);
            // Get the position the blip should be placed at
            const x = VYLO.Math.clamp((blip.screenPos.x + scrM.xMapPos + (mapInstanceIconWidth / 2) - blipIconWidth / VYLO.Client.mapView.scale.x) * VYLO.Client.mapView.scale.x, -blipIconWidth + blip.settings.buffer, BlipManagerSingleton.GAME_SIZE.width - blipIconWidth - blip.settings.buffer);
            const y = VYLO.Math.clamp((blip.screenPos.y + scrM.yMapPos + (mapInstanceHeight / 2) - blipIconHeight / 2 / VYLO.Client.mapView.scale.y) * VYLO.Client.mapView.scale.y, (-blipIconHeight / 2) + blip.settings.buffer, BlipManagerSingleton.GAME_SIZE.height - (blipIconHeight / 2) - blip.settings.buffer);
            // Check distance between map instance and client mob
            const distance = Math.round(BlipManagerSingleton.getDistance(VYLO.Client.mob, blip.mapInstance, true));
            // Check angle from client mob to map instance
            const angle = BlipManagerSingleton.getAngle(VYLO.Client.mob, blip.mapInstance, true);
            // Check the direction of the angle
            const direction = BlipManagerSingleton.getDirection(angle);      
            // Whether the blip will be shown or not
            let showBlip = false;
            // Setting the angle of the blip
            blip.angle = angle;
            // Setting the blip to the proper coordinates
            blip.setPos(x, y);

            if (distance < blip.settings.maxDistance) {
                const furtherThanHalfHorizontalScreenSize = distance >= (BlipManagerSingleton.GAME_SIZE_HALF.width - (mapInstanceIconWidth / 2)) / VYLO.Client.mapView.scale.x;
                const furtherThanHalfVerticalScreenSize = distance >= (BlipManagerSingleton.GAME_SIZE_HALF.height - (mapInstanceHeight / 2)) / VYLO.Client.mapView.scale.y;
                // Check the direction so we know whether to show the blip or not. Some directions make it so the formula changes on whether to show it or not
                switch (direction) {
                    case 'north':
                    case 'south':
                        if (furtherThanHalfVerticalScreenSize) {
                            showBlip = true;
                        }
                        break;

                    case 'east':
                    case 'west':
                        if (furtherThanHalfHorizontalScreenSize) {
                            showBlip = true;
                        }
                        break;
                    
                    /**
                     * @todo Fix issue where lower distance sometimes makes blip hide
                     */
                    case 'northwest':
                    case 'northeast':
                    case 'southwest':
                    case 'southeast':
                        if (furtherThanHalfHorizontalScreenSize || furtherThanHalfVerticalScreenSize) {
                            showBlip = true;
                        }
                        break;
                }
            }

            if (showBlip) {
                blip.show();
            } else {
                blip.hide();
            }
            /**
             * @todo Handle the distance text being shown
             */
        }
    }
    /**
     * Hides all blips
     */
    hideBlips() {
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
* @license Blip is licensed under an MIT styled license.
* @author https://github.com/doubleactii
* Copyright (c) 2023 Evitca Studio
*/
export class BlipComponent {
    /**
     * This is the static distance it will be from the side of the game window
     * @type {number}
     */
    static BUFFER = 25;
    /**
     * This is the maximum distance at which the blip will be removed. (Distance from the center of the screen)
     * @type {number}
     */
    static MAX_DIST = 1000;
    /**
     * This is the max plane/layer at which this blip will exist. This will overlay this blip icon over any other interface element
     * @type {number}
     */
    static MAX_DISPLAY = 9999;
    /**
     * The blip instance that is created/recycled. This will be a Diob instance
     * @type {Object}
     */
    instance = null;
    /**
     * @param {Object} pMapInstance - The instance this blip will represent
     * @param {Object} pIconSettings - An object with settings holding the icon information for the blip
     * @param {Object} pBlipSettings - AN object with settings on how the blip will behave
     */
    constructor(pMapInstance, pIconSettings = { 'atlasName': '', 'iconName': '' }, pBlipSettings = { 'buffer': BlipComponent.BUFFER, 'showsDistance': false, 'maxDistance': BlipComponent.MAX_DIST, 'alwaysOnTop': false }, pMarkerSettings) {
       // Do not allow more than the max amount of blips to be created.
        if (BlipManager.activeBlips.length >= BlipManagerSingleton.MAX_BLIPS) {
            BlipManager.logger.prefix('BlipComponent-Module').log('Max blip limit reached');
            return;
        }

        // Creating/Recyling the blip
        const blip = Collector.isInCollection('Interface', 1, BlipManagerSingleton.storedBlips);
        blip.touchOpacity = 0;
        blip.mouseOpacity = 0;
        blip.preventAutoScale = false;
        blip.anchor.x = 1;
        blip.anchor.y = 0.5;
        // Assigning icon data to the blip
        blip.atlasName = pIconSettings.atlasName;
        blip.iconName = pIconSettings.iconName;
        // Allow map instance to be referenced via the blip
        blip.mapInstance = pMapInstance;
        blip.screenPos = { x: 0, y: 0 };
        blip.settings = {
            // The padding between the blip and the screen
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
    }
    /**
     * Removes this blip
     */
    remove() {
        // We check if there is an instance attached to this blip, because some blips can be created when the max blips already exist and they will be useless
        if (this.instance) this.instance.hide();
        BlipManager.untrack(this.instance);
    }
}
