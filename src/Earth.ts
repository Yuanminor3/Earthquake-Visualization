/* Assignment 3: Earthquake Visualization Support Code
 * UMN CSci-4611 Instructors 2012+
 * GopherGfx implementation by Evan Suma Rosenberg <suma@umn.edu> 2022
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * Please do not distribute beyond the CSci-4611 course
 */ 

import * as gfx from 'gophergfx'
import { EarthquakeMarker } from './EarthquakeMarker';
import { EarthquakeRecord } from './EarthquakeRecord';
import { EarthquakeDatabase } from './EarthquakeDatabase';

export class Earth extends gfx.Node3
{
    private earthMesh: gfx.MorphMesh3;

    public globeMode: boolean;

    constructor()
    {
        // Call the superclass constructor
        super();

        this.earthMesh = new gfx.MorphMesh3();

        this.globeMode = false;
    }

    public createMesh() : void
    {
        // Initialize texture: you can change to a lower-res texture here if needed
        // Note that this won't display properly until you assign texture coordinates to the mesh
        this.earthMesh.material.texture = new gfx.Texture('./assets/earth-2k.png');
        
        // This disables mipmapping, which makes the texture appear sharper
        this.earthMesh.material.texture.setMinFilter(true, false);   

        // You can use this variable to define the resolution of your flat map and globe map
        // using a nested loop. 20x20 is reasonable for a good looking sphere, and you don't
        // need to change this constant to complete the base assignment.
        const meshResolution = 20;
        
        // Precalculated vertices and normals for the earth plane mesh.
        // After we compute them, we can store them directly in the earthMesh,
        // so they don't need to be member variables.
        const mapVertices: gfx.Vector3[] = [];
        const mapNormals: gfx.Vector3[] = [];

        // Part 1: Creating the Flat Map Mesh
        // To demo, we'll add a rectangle with two triangles.
        // This defines four vertices at each corner in latitude and longitude 
        // and converts to the coordinates used for the flat map.

        const leftDown = this.convertLatLongToPlane(-90, -180);
        const rightDown = this.convertLatLongToPlane(-90, 180);
        const rightUp = this.convertLatLongToPlane(90, 180);
        const leftUp = this.convertLatLongToPlane(90, -180);

        const xStart = leftDown.x;
        const xEnd = rightDown.x;
        const yStart = rightDown.y;
        const yEnd = rightUp.y;
        const xRange = xEnd - xStart;
        const yRange = yEnd - yStart;


        for (let j=0; j <= meshResolution; j++) {
            const curY = yStart + j / meshResolution * yRange;
            for (let i=0; i <= meshResolution; i++) {
                const curX = xStart + i / meshResolution * xRange;
                mapVertices.push(new gfx.Vector3(curX, curY, 0));
                // The flat map normals are always directly outward towards the camera
                mapNormals.push(gfx.Vector3.BACK);
            }

        }


        // Define indices into the array for the two triangles
        const indices: number[] = [];
        for (let j=0; j < meshResolution; j++) {
            const offset = j * (meshResolution + 1);
            for (let i=1; i <= meshResolution; i++) {
                indices.push(offset+i-1, offset+i, offset+meshResolution+i);
                indices.push(offset+i, offset + meshResolution+i+1, offset+meshResolution+i);
            }
        }

        // Part 2: Texturing the Mesh
        // You should replace the example code below with texture coordinates for the earth mesh.
        const texCoords: number[] = [];

        for (let j=0; j <= meshResolution; j++) {
            const curY = 1 - j/meshResolution;
            for (let i=0; i <= meshResolution; i++) {
                const curX = i/meshResolution;
                texCoords.push(curX, curY);
            }

        }
        // Set all the earth mesh data
        this.earthMesh.setVertices(mapVertices, true);
        this.earthMesh.setNormals(mapNormals, true);
        this.earthMesh.setIndices(indices);
        this.earthMesh.setTextureCoordinates(texCoords);

        // Part 3: Creating the Globe Mesh
        // You should compute a new set of vertices and normals
        // for the globe. You will need to also add code in
        // the convertLatLongToSphere() method below.

        const sphereVertices: gfx.Vector3[] = [];
        const sphereNormals: gfx.Vector3[] = [];
        for (let j=0; j <= meshResolution; j++) {
            const curY = yStart + j / meshResolution * yRange;
            for (let i=0; i <= meshResolution; i++) {
                const curX = xStart + i / meshResolution * xRange;
                const curLat = curY * 180 / Math.PI;
                const curLog = curX * 180 / Math.PI;
                const temp = this.convertLatLongToSphere(curLat, curLog);
                sphereVertices.push(temp);

                // add normals
                const curNorm = gfx.Vector3.normalize(temp);
                sphereNormals.push(curNorm);
            }

        }
        this.earthMesh.setMorphTargetVertices(sphereVertices);
        this.earthMesh.setMorphTargetNormals(sphereNormals);

        // Add the mesh to this group
        this.add(this.earthMesh);
    }

    public update(deltaTime: number) : void
    {
        // Part 4: Morphing Between the Map and Globe
        // The value of this.globeMode will be changed whenever
        // the user selects flat map or globe mode in the GUI.
        // You should use this boolean to control the morphing
        // of the earth mesh, as described in the readme.

        // Adjust the speed of morphing
        const diff = gfx.MathUtils.lerp(0,1,deltaTime);
        if (this.globeMode) {
            this.earthMesh.morphAlpha = Math.min(1, this.earthMesh.morphAlpha + diff);
        } else {
            this.earthMesh.morphAlpha = Math.max(0, this.earthMesh.morphAlpha - diff); 
        }
    }

    public createEarthquake(record: EarthquakeRecord)
    {
        // Number of milliseconds in 1 year (approx.)
        const duration = 12 * 28 * 24 * 60 * 60;

        // Part 5: Creating the Earthquake Markers
        // Currently, the earthquakes are just placed randomly
        // on the plane. You will need to update this code to
        // correctly calculate both the map and globe positions of the markers.
        const lat = record.latitude;
        const log = record.longitude;
        
        const mapPosition = this.convertLatLongToPlane(lat, log);
        const globePosition = this.convertLatLongToSphere(lat, log);

        const earthquake = new EarthquakeMarker(mapPosition, globePosition, record, duration);

        // Global adjustment to reduce the size. You should probably
        // update this be a more meaningful representation.


        // Calculate the size and color based on earthquake magnitude
        const minSize = 0.01; // Define a minimum size
        const maxSize = 0.6; // Define a maximum size

        const minMagnitude = 4;// Minimum earthquake magnitude
        const maxMagnitude = 9;// Maximum earthquake magnitude

        // Use lerp to determine the size based on magnitude
        const size = gfx.MathUtils.lerp(minSize, maxSize, (record.magnitude - minMagnitude) / (maxMagnitude - minMagnitude));
        // Use lerp to determine the color based on magnitude

        const minColor = gfx.Color.YELLOW; // Yellow
        const maxColor = gfx.Color.RED; // Red
        
        const color = gfx.Color.lerp(minColor, maxColor, (record.magnitude - minMagnitude) / (maxMagnitude - minMagnitude));
        // Set the size and color
        earthquake.scale.set(size, size, size);
        earthquake.material.setColor(color);

        // Uncomment this line of code to active the earthquake markers
        this.add(earthquake);
    }

    public animateEarthquakes(currentTime : number)
    {
        // This code removes earthquake markers after their life has expired
        this.children.forEach((quake: gfx.Node3) => {
            if(quake instanceof EarthquakeMarker)
            {
                const playbackLife = (quake as EarthquakeMarker).getPlaybackLife(currentTime);

                // The earthquake has exceeded its lifespan and should be moved from the scene
                if(playbackLife >= 1)
                {
                    quake.remove();
                }
                // The earthquake positions should be updated
                else
                {
                    // Part 6: Morphing the Earthquake Positions
                    // If you have correctly computed the flat map and globe positions
                    // for each earthquake marker in part 5, then you can simply lerp
                    // between them using the same alpha as the earth mesh.
                    

                    const alpha = this.earthMesh.morphAlpha; // Use the Earth mesh's alpha value

                    const mapPosition = (quake as EarthquakeMarker).mapPosition;
                    const globePosition = (quake as EarthquakeMarker).globePosition;

                    // Interpolate between mapPosition and globePosition based on alpha
                    const interpolatedPosition = gfx.Vector3.lerp(mapPosition, globePosition, alpha);
                    // Update the earthquake marker's position
                    (quake as EarthquakeMarker).position.copy(interpolatedPosition);
                }
            }
        });
    }

    // This convenience method converts from latitude and longitude (in degrees) to a Vector3 object
    // in the flat map coordinate system described in the readme.
    public convertLatLongToPlane(latitude: number, longitude: number): gfx.Vector3
    {
        return new gfx.Vector3(longitude * Math.PI / 180, latitude * Math.PI / 180, 0);
    }

    // This convenience method converts from latitude and longitude (in degrees) to a Vector3 object
    // in the globe mesh map coordinate system described in the readme.
    public convertLatLongToSphere(latitude: number, longitude: number): gfx.Vector3
    {
        // Part 3: Creating the Globe Mesh
        // Add code here to correctly compute the 3D sphere position
        // based on latitude and longitude.
        const log = longitude * Math.PI / 180;
        const lat = latitude * Math.PI / 180;
        return new gfx.Vector3(Math.cos(lat)*Math.sin(log), Math.sin(lat), Math.cos(lat)*Math.cos(log));
    }

    // This function toggles the wireframe debug mode on and off
    public toggleDebugMode(debugMode : boolean)
    {
        this.earthMesh.material.wireframe = debugMode;
    }
}