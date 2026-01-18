January 2, 2026

"Twelve principles of animation"

There isn't much to it. The 12 principles of animation are too broad to bring into a single 3d animation, so I went with the more simple stretch and squash: taking a vertex shader to distort a shape (a rounded cylinder) based on the speed along a curve. The shape "stretches" as it gains speed, and "squashes" when reaching the destination, with a not-so-subtle bounce. I tried adding anticipation, with a bit of a twirl before starting, but the easing curves started to get too complex.

In the first iteration it was from points interpolated with a Bezier, then it was a bunch of "dots" moving between positions on the surface of a sphere, the positions distributed evenly on the sphere. I ended up replacing the shape with a trefoil knot, and tweaking a bit the animations and the parameters.
