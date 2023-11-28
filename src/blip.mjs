import { InstanceMarker } from './instanceMarker.mjs';
import { Logger } from './vendor/logger.min.mjs';

console.log(Logger);
class BlipManager {
    /**
     * The maximum number of blips that can exist on the screen at once
     * @type {number}
     */
    static MAX_BLIPS = 200;
}

export class Blip {
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

}

