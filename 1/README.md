I thought of exploring a shape changing and morphing into similar shapes. My first question was if a 3d object, like a polyhedron, can have a "shape".
I had the idea when looking on google images for "shapes of a polyhedron" and saw https://d138zd1ktt9iqe.cloudfront.net/media/seo_landing_files/types-of-polyhedron-2-1621858965.png

Then it was a matter of picking the relevant pieces from http://github.com/spite/inktober-2025/ and build a demo. I considered using this Genuary to try TSL.

The SDFs are a bit from shadertoy, a bit from the Internet, a bit from Gemini. The easings are also from different implementations from all over.
The lights are from the threejs examples. The vertex shader override I'm not sure if there's a more modern way to do that. I guess that's what TSL is for.
The environment mapping is also from the threejs example.

I tweaked a bit the easing on the shader. I wanted to make it a bit more organic and blobby, and tried with variable delays per vertex, but it was messing all the computations, which assume the range is 0-1.
I also tried modify the easing with a Simplex 3D Perlin noise, and it looked somewhat nice but I didn't end up liking it. I also tried interpolating via a sphere halfway, but again, it was interesting but not really "it".

All in all, this took ... 3-4 hours? I'll have to track time better next time. A lot of the code was already there. it was mostly debugging the tetrahedron SDF not rendering correctly, and porting the different easings to GLSL.
