let e = 0.01, // epsilon
	abs = Math.abs,
	cos = Math.cos,
	max = Math.max,
	min = Math.min,
	sin = Math.sin,
	sqrt = Math.sqrt,
	tan = Math.tan,
	PI = Math.PI,
	// cube:
	c = (x, y, z) => {
		let px = abs(x) - 1; // last number is cube size
		let py = abs(y) - 1;
		let pz = abs(z) - 1;

		let qx = max(px, 0);
		let qy = max(py, 0);
		let qz = max(pz, 0);

		return sqrt(qx * qx + qy * qy + qz * qz) + min(max(px, max(py, pz)), 0);
	},
	// rotate:
	r = (x, y, z, rotX, rotY) => {
		let cosY = cos(rotY),
			sinY = sin(rotY),
			x1 = x * cosY + z * sinY,
			z1 = -x * sinY + z * cosY,
			cosX = cos(rotX),
			sinX = sin(rotX);
		return [x1, y * cosX - z1 * sinX, y * sinX + z1 * cosX];
	},
	/**
	 * Calculate normal using finite differences
	 */
	n = (x, y, z) => {
		let dx = c(x + e, y, z) - c(x - e, y, z);
		let dy = c(x, y + e, z) - c(x, y - e, z);
		let dz = c(x, y, z + e) - c(x, y, z - e);

		let len = sqrt(dx * dx + dy * dy + dz * dz);
		return [dx / len, dy / len, dz / len];
	},
	/**
	 * Ray marching function
	 */
	m = (origin, direction, rotationX, rotationY) => {
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
	d = (canvas, ctx, imageData, data, rotationX, rotationY) => {
		let width = canvas.width;
		let height = canvas.height;
		let cameraPos = [0, 0, -5];
		// let fov = 1;
		// let aspect = width / height;
		let tanFovAspect = 0.5; // tan(fov / 2);

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
				let len = sqrt(rayDir[0] * rayDir[0] + rayDir[1] * rayDir[1] + rayDir[2] * rayDir[2]);
				rayDir[0] /= len;
				rayDir[1] /= len;
				rayDir[2] /= len;

				// Ray march
				let result = m(cameraPos, rayDir, rotationX, rotationY);

				let idx = (y * width + x) * 4;

				if (result) {
					// Rotate normal back to world space (inverse: -X then -Y)
					let n = result;
					let cosX = cos(-rotationX),
						sinX = sin(-rotationX);
					let y1 = n[1] * cosX - n[2] * sinX,
						z1 = n[1] * sinX + n[2] * cosX;
					let cosY = cos(-rotationY),
						sinY = sin(-rotationY);
					let worldNormal = [n[0] * cosY + z1 * sinY, y1, -n[0] * sinY + z1 * cosY];

					let dot = max(0, -worldNormal[0]);

					// Ambient + diffuse lighting
					let ambient = 0.2;
					let intensity = ambient + (1 - ambient) * dot;

					// Color the cube (cyan-ish)
					data[idx] = 100 * intensity; // R
					data[idx + 1] = 200 * intensity; // G
					data[idx + 2] = 255 * intensity; // B
					data[idx + 3] = 255; // A
				} else {
					// Background gradient
					let bgIntensity = 0.1;
					data[idx] = bgIntensity * 50;
					data[idx + 1] = bgIntensity * 50;
					data[idx + 2] = bgIntensity * 60;
					data[idx + 3] = 255;
				}
			}
		}

		ctx.putImageData(imageData, 0, 0);
	};
