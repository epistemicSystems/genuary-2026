January 6, 2026

"Lights on/off. Make something that changes when you switch on or off the “digital” lights."

I had an idea almost right away. After doing Day 1 i would have liked the shape to have some texture (specially some greasy fingerprints), but i didn't have time for that day to go through all the normal mapping stuff, given that i was "hijacking" MeshStandardMaterial. But after being able to take away most of the code i need into my own material, i thought i'd give it a try. So the idea would be to apply the fingerprints and highlight them with Luminol and UV Light.

So the first part has been figuring out how to modularise the normal mapping -and the regular map, roughness and metalness-. The second part, creating a generative fingerprints texture. I took some different pictures from the Internet and composed an atlas, and then used Canvas to draw them at different sizes and rotations, making sure it tiles. Then i took old code that turned a heightmap into a normal map (thanks to mrdoob for reminding me of ShaderTexture!). Then the next step was to bring triplanar mapping to correctly texture the different shapes.

The final step was turning on/off the lights. I ended up using the default postprocessing pipeline -which i usually don't use because i find it difficult to get to do what i want. And, effectively, for some reason, even setting strength and radius to 0 on the BlooomPass, i was still getting altered colors. My idea was to cross-fade quickly between the normal light and the UV light, making the Luminol traces linger a bit. But it's an abrupt cut.
