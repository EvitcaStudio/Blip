export class InstanceMarker {
    /**
     * This is distance at which the marker is removed from the screen. (Distance from the center of the screen)
     */
    static REMOVAL_DISTANCE = 50;
    
    constructor(pMapInstance, pIconSettings = { 'atlasName': '', 'iconName': '' }, pMarkerSettings = { 'showsDistance': false, 'removalDistance': InstanceMarker.REMOVAL_DISTANCE }) {

    }
}
