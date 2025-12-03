const epsilon = 0.001;

function cubeSDF(x, y, z, size, cx = 0, cy = 0, cz = 0) {
  const px = Math.abs(x - cx) - size;
  const py = Math.abs(y - cy) - size;
  const pz = Math.abs(z - cz) - size;
  
  const qx = Math.max(px, 0);
  const qy = Math.max(py, 0);
  const qz = Math.max(pz, 0);
  
  return Math.sqrt(qx * qx + qy * qy + qz * qz) + Math.min(Math.max(px, Math.max(py, pz)), 0);
}

function rotatePoint(x, y, z, rotX, rotY) {
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY, z1 = -x * sinY + z * cosY;
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  return [x1, y * cosX - z1 * sinX, y * sinX + z1 * cosX];
}

/**
 * Calculate normal using finite differences
 */
function calculateNormal(x, y, z) {
  
  const dx = cubeSDF(x + epsilon, y, z, 1.0) - cubeSDF(x - epsilon, y, z, 1.0);
  const dy = cubeSDF(x, y + epsilon, z, 1.0) - cubeSDF(x, y - epsilon, z, 1.0);
  const dz = cubeSDF(x, y, z + epsilon, 1.0) - cubeSDF(x, y, z - epsilon  , 1.0);
  
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return [dx / len, dy / len, dz / len];
}

/**
 * Ray marching function
 */
function rayMarch(origin, direction, rotationX, rotationY, maxSteps = 100, maxDist = 100) {
  let t = 0;
  
  for (let i = 0; i < maxSteps; i++) {
    const point = [
      origin[0] + direction[0] * t,
      origin[1] + direction[1] * t,
      origin[2] + direction[2] * t
    ];
    
    // Rotate the point to match camera rotation
    const [px, py, pz] = rotatePoint(point[0], point[1], point[2], rotationX, rotationY);
    
    // Calculate distance to cube
    const dist = cubeSDF(px, py, pz, 1.0);
    
    if (dist < epsilon) {
      // Hit! Calculate normal for shading
      const normal = calculateNormal(px, py, pz);
      return { hit: true, t: t, normal: normal };
    }
    
    t += dist;
    
    if (t > maxDist) {
      break;
    }
  }
  
  return { hit: false };
}

/**
 * Render function
 */
function render(canvas, ctx, imageData, data, rotationX, rotationY) {
  const width = canvas.width;
  const height = canvas.height;
  const cameraPos = [0, 0, -5];
  const fov = Math.PI / 3;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Convert pixel coordinates to normalized device coordinates
      const ndcX = (x / width) * 2 - 1;
      const ndcY = 1 - (y / height) * 2;
      const aspect = width / height;
      
      // Calculate ray direction
      const rayDir = [
        Math.tan(fov / 2) * aspect * ndcX,
        Math.tan(fov / 2) * ndcY,
        1
      ];
      
      // Normalize ray direction
      const len = Math.sqrt(rayDir[0] * rayDir[0] + rayDir[1] * rayDir[1] + rayDir[2] * rayDir[2]);
      rayDir[0] /= len;
      rayDir[1] /= len;
      rayDir[2] /= len;
      
      // Ray march
      const result = rayMarch(cameraPos, rayDir, rotationX, rotationY);
      
      const idx = (y * width + x) * 4;
      
      if (result.hit) {
        // Rotate normal back to world space (inverse: -X then -Y)
        const n = result.normal;
        const cosX = Math.cos(-rotationX), sinX = Math.sin(-rotationX);
        const y1 = n[1] * cosX - n[2] * sinX, z1 = n[1] * sinX + n[2] * cosX;
        const cosY = Math.cos(-rotationY), sinY = Math.sin(-rotationY);
        const worldNormal = [n[0] * cosY + z1 * sinY, y1, -n[0] * sinY + z1 * cosY];
        
        const dot = Math.max(0, -worldNormal[0]);
        
        // Ambient + diffuse lighting
        const ambient = 0.2;
        const intensity = ambient + (1 - ambient) * dot;
        
        // Color the cube (cyan-ish)
        data[idx] = 100 * intensity;     // R
        data[idx + 1] = 200 * intensity; // G
        data[idx + 2] = 255 * intensity; // B
        data[idx + 3] = 255;             // A
      } else {
        // Background gradient
        const bgIntensity = 0.1;
        data[idx] = bgIntensity * 50;
        data[idx + 1] = bgIntensity * 50;
        data[idx + 2] = bgIntensity * 60;
        data[idx + 3] = 255;
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { render };
}
