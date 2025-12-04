let e = 0.01, // epsilon
	A = Math.abs,
	C = Math.cos,
	M = Math.max,
	m = Math.min,
	S = Math.sin,
	_ = Math.sqrt,
	// cube:
	c = (x, y, z) => {
		let px = A(x) - 1; // last number is cube size
		let py = A(y) - 1;
		let pz = A(z) - 1;

		let qx = M(px, 0);
		let qy = M(py, 0);
		let qz = M(pz, 0);

		return _(qx * qx + qy * qy + qz * qz) + m(M(px, M(py, pz)), 0);
	},
	// rotate:
	r = (x, y, z, rotX, rotY) => {
		let cosY = C(rotY),
			sinY = S(rotY),
			x1 = x * cosY + z * sinY,
			z1 = -x * sinY + z * cosY,
			cosX = C(rotX),
			sinX = S(rotX);
		return [x1, y * cosX - z1 * sinX, y * sinX + z1 * cosX];
	},
	/**
	 * Calculate normal using finite differences
	 */
	n = (x, y, z) => {
		let dx = c(x + e, y, z) - c(x - e, y, z);
		let dy = c(x, y + e, z) - c(x, y - e, z);
		let dz = c(x, y, z + e) - c(x, y, z - e);

		let len = _(dx * dx + dy * dy + dz * dz);
		return [dx / len, dy / len, dz / len];
	},
	/**
	 * Ray marching function
	 */
	z = (rx, ry, rz, rotationX, rotationY) => {
		let t = 0;

		// for (let i = 0; i < 99; i++) {
		while (t < 99) {
			let x = rx * t,
				y = ry * t,
				z =
					-5 + // camera position z
					rz * t;

			// Rotate the point to match camera rotation
			let [px, py, pz] = r(x, y, z, rotationX, rotationY);

			// Calculate distance to cube
			let dist = c(px, py, pz);

			if (dist < 0.002) {
				// Hit! Calculate normal for shading
				return n(px, py, pz);
			}
			t += dist;
		}
		// return nothing if no hit
	},
	/**
	 * Render function
	 */
	d = (time) => {
		let rotationX = time * 0.0005,
			rotationY = time * 0.00089;
		let size = 400;

		let tanFovAspect = 0.5; // tan(field of vision / 2);
		let intensities = [];

		for (let i = 0; i < size * size; i++) {
			let x = i % size;
			let y = ~~(i / size);
			// Convert pixel coordinates to normalized device coordinates
			let ndcX = (x / size) * 2 - 1;
			let ndcY = 1 - (y / size) * 2;

			// Calculate ray direction
			let rx =
					tanFovAspect *
					// aspect * // assuming an aspect of 1, ie square canvas, no need for this
					ndcX,
				ry = tanFovAspect * ndcY,
				rz = 1;

			// Normalize ray direction
			let len = _(rx * rx + ry * ry + rz * rz);
			rx /= len;
			ry /= len;
			rz /= len;

			// Ray march
			let result = z(rx, ry, rz, rotationX, rotationY);

			let idx = i * 4;

			if (result) {
				// Rotate normal back to world space (inverse: -X then -Y)
				let [nx, ny, nz] = result;
				let cosX = C(-rotationX),
					sinX = S(-rotationX);
				let z1 = ny * sinX + nz * cosX;
				let cosY = C(-rotationY),
					sinY = S(-rotationY);
				// let worldNormal = [n[0] * cosY + z1 * sinY, y1, -n[0] * sinY + z1 * cosY];
				// let dot = M(0, -worldNormal[0]);
				let worldNormal = nx * cosY + z1 * sinY;
				let dot = M(0, -worldNormal);

				// Ambient + diffuse lighting
				let ambient = 0.2;
				let intensity = ambient + (1 - ambient) * dot;
				// Color the cube (cyan-ish)

				//*
				data[idx] = 100 * intensity; // R
				data[idx + 1] = 200 * intensity; // G
				data[idx + 2] = 255 * intensity; // B
				data[idx + 3] = 255; // A
        //*/

				intensities[i] = 0.2 + 0.8 * dot;
			} else {
				// Background gradient
				//*
				let bgIntensity = 0.1;
				data[idx] = bgIntensity * 50;
				data[idx + 1] = bgIntensity * 50;
				data[idx + 2] = bgIntensity * 60;
				data[idx + 3] = 255;
        //*/
				// intensities[i] = 0; // no need, leave it empty
			}
		}

		ctx.putImageData(imageData, 0, 0);

		// Draw horizontal sine waves
		X.fillRect(0, 0, size, size);
		X.strokeStyle = "#fff";
		let numWaves = 20;
		let waveSpacing = size / numWaves;

		for (let w = 0; w < numWaves; w++) {
			let y = (w + 0.5) * waveSpacing;
			// Draw sine wave with amplitude
			X.beginPath();
			for (let x = 0; x < size; x++) {
				const intense = intensities[x + y * size] || 0;
				let amplitude = intense * size * 0.03;
				let waveY = y + S(x * 0.6 + time * 0.004) * amplitude;
				if (x) {
					X.lineTo(x, waveY);
				} else {
					X.moveTo(x, waveY);
				}
			}
			X.stroke();
		}

		requestAnimationFrame(d);
	};
