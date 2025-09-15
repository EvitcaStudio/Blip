import { IconSettings, MarkerSettings } from './blip.js';

export class InstanceMarker {
    /**
     * This is distance at which the marker is removed from the screen. (Distance from the center of the screen).
     */
    static REMOVAL_DISTANCE = 50;

    /**
     * @param pMapInstance - Instance settings.
     * @param pIconSettings - Icon settings.
     * @param pMarkerSettings - Marker settings.
     */
    constructor(pMapInstance: any, pIconSettings: IconSettings = { 'atlasName': '', 'iconName': '' }, pMarkerSettings: MarkerSettings = { 'showsDistance': false, 'removalDistance': InstanceMarker.REMOVAL_DISTANCE }) {

    }
}
