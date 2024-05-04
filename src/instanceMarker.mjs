export class InstanceMarker {
    /**
     * This is distance at which the marker is removed from the screen. (Distance from the center of the screen).
     * @private
     * @type {number}
     */
    static REMOVAL_DISTANCE = 50;
    /**
     * @private
     * @param {Object} pMapInstance - Instance settings.
     * @param {Object} pIconSettings - Icon settings.
     * @param {Object} pMarkerSettings - Marker settings.
     */
    constructor(pMapInstance, pIconSettings = { 'atlasName': '', 'iconName': '' }, pMarkerSettings = { 'showsDistance': false, 'removalDistance': InstanceMarker.REMOVAL_DISTANCE }) {

    }
}
