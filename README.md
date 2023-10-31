In part 5, I defined minSize, maxSize, minMagnitude and maxMagnitude on my own below:

        const minSize = 0.01; // Define a minimum size
        const maxSize = 0.6; // Define a maximum size

        const minMagnitude = 4;// Minimum earthquake magnitude
        const maxMagnitude = 9;// Maximum earthquake magnitude

Which are based on "./public/assets/earthquakes.txt" and make each size and color are more obvious to be differentiated by its magnitude.
Note: .txt file, I noticed there is no maginitude is less than 4 and larger than 9.

Here, with larger magnitude value, sphere of each earthquake on the map is more RED from YELLOW and radius is bigger.
Note: Over time, the display differences of magnitude of earthquake gets wider and more obvious.

Then, I used lerp() to make changes smoother:

        const size = gfx.MathUtils.lerp(minSize, maxSize, (record.magnitude - minMagnitude) / (maxMagnitude - minMagnitude));

        const minColor = gfx.Color.YELLOW; // Yellow
        const maxColor = gfx.Color.RED; // Red
        
        const color = gfx.Color.lerp(minColor, maxColor, (record.magnitude - minMagnitude) / (maxMagnitude - minMagnitude))