# Sine waves make out a cube in less than 1K of javascript

I came across this cool [codepen](https://codepen.io/jkantner/pen/bNpaQJN) by [@jkantner](https://codepen.io/jkantner) and was inspired to implement this in less than 1024 bytes.

More details at my [blog](https://raurir.com/posts/js1k-cube-sine-sdf/)

Respect must given to the original: [Wavy line cube by Mark Edwards](https://dribbble.com/shots/9174038-Wavy-line-cube)

**Disclaimer**: I did use AI (cursor) to shortcut some old concepts that I couldn't be bothered relearning: Signed distance functions, rotating vectors, normalising to pixel space, and heaps of other 3D maths. Maybe Jon did too? Hmmm :)

Clearly, this is not purely under 1K. Back in the JS1K days, we had some basic rules: you get a canvas, a context, and a few other things to get going. That saves you a bunch of bytes (see the HTML part). But, there's no code there really, just initialisation. You make your own judgement.

Once again, back in the old days (hah), I would hand minify and use whatever crunch tools were on hand. This time I went straight for terser, because AI told me. But much hand coded optimisation was needed. Terser could only get me to around 3.5K before hacking properly.

If you're interested in more minified code, check [raurir.com/tags/js1k/](https://raurir.com/tags/js1k/)
