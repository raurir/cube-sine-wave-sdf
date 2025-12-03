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
	z = (origin, direction, rotationX, rotationY) => {
		let t = 0;

		for (let i = 0; i < 100; i++) {
			let point = [origin[0] + direction[0] * t, origin[1] + direction[1] * t, origin[2] + direction[2] * t];

			// Rotate the point to match camera rotation
			let [px, py, pz] = r(point[0], point[1], point[2], rotationX, rotationY);

			// Calculate distance to cube
			let dist = c(px, py, pz);

			if (dist < 0.002) {
				// Hit! Calculate normal for shading
				return n(px, py, pz);
			}

			t += dist;

			if (t > 100) {
				break;
			}
		}

		// return nothing if no hit
	},
	/**
	 * Render function
	 */
	d = (time, canvas, ctx, imageData, data, waveCanvas, waveCtx, rotationX, rotationY) => {
		let width = canvas.width;
		let height = canvas.height;
		let cameraPos = [0, 0, -5];
		// let fov = 1;
		// let aspect = width / height;
		let tanFovAspect = 0.5; // tan(fov / 2);
		let intensities = [];

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				// Convert pixel coordinates to normalized device coordinates
				let ndcX = (x / width) * 2 - 1;
				let ndcY = 1 - (y / height) * 2;

				// Calculate ray direction
				let rayDir = [
					tanFovAspect *
						// aspect * // this assumes an aspect of 1, ie square canvas!
						ndcX,
					tanFovAspect * ndcY,
					1,
				];

				// Normalize ray direction
				let len = _(rayDir[0] * rayDir[0] + rayDir[1] * rayDir[1] + rayDir[2] * rayDir[2]);
				rayDir[0] /= len;
				rayDir[1] /= len;
				rayDir[2] /= len;

				// Ray march
				let result = z(cameraPos, rayDir, rotationX, rotationY);

				let idx = (y * width + x) * 4;
				let intensity = 0;

				if (!intensities[y]) intensities[y] = [];

				if (result) {
					// Rotate normal back to world space (inverse: -X then -Y)
					let n = result;
					let cosX = C(-rotationX),
						sinX = S(-rotationX);
					let y1 = n[1] * cosX - n[2] * sinX,
						z1 = n[1] * sinX + n[2] * cosX;
					let cosY = C(-rotationY),
						sinY = S(-rotationY);
					let worldNormal = [n[0] * cosY + z1 * sinY, y1, -n[0] * sinY + z1 * cosY];

					let dot = M(0, -worldNormal[0]);

					// Ambient + diffuse lighting
					let ambient = 0.2;
					intensity = ambient + (1 - ambient) * dot;

					// Color the cube (cyan-ish)
					data[idx] = 100 * intensity; // R
					data[idx + 1] = 200 * intensity; // G
					data[idx + 2] = 255 * intensity; // B
					data[idx + 3] = 255; // A

					intensities[y][x] = intensity;
				} else {
					// Background gradient
					let bgIntensity = 0.1;
					intensity = bgIntensity;
					data[idx] = bgIntensity * 50;
					data[idx + 1] = bgIntensity * 50;
					data[idx + 2] = bgIntensity * 60;
					data[idx + 3] = 255;

					intensities[y][x] = 0;
				}
			}
		}

		ctx.putImageData(imageData, 0, 0);

		// Draw horizontal sine waves to second canvas
		waveCtx.fillRect(0, 0, width, height);
		waveCtx.strokeStyle = "#fff";
		let numWaves = 20;
		let waveSpacing = height / numWaves;

		for (let w = 0; w < numWaves; w++) {
			let y = (w + 0.5) * waveSpacing;
			// Draw sine wave with amplitude based on row intensity
			waveCtx.beginPath();
			for (let x = 0; x < width; x++) {
				const intense = intensities[y][x];
				let amplitude = intense * height * 0.03;
				let waveY = y + S(x * 0.6 + time * 0.004) * amplitude;
				if (x === 0) {
					waveCtx.moveTo(x, waveY);
				} else {
					waveCtx.lineTo(x, waveY);
				}
			}
			waveCtx.stroke();
		}
	};
