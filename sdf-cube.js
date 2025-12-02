
function cubeSDF(x, y, z, size, cx = 0, cy = 0, cz = 0) {
  const px = Math.abs(x - cx) - size;
  const py = Math.abs(y - cy) - size;
  const pz = Math.abs(z - cz) - size;
  
  const qx = Math.max(px, 0);
  const qy = Math.max(py, 0);
  const qz = Math.max(pz, 0);
  
  return Math.sqrt(qx * qx + qy * qy + qz * qz) + Math.min(Math.max(px, Math.max(py, pz)), 0);
}

/**
 * Rotate point around Y axis, then X axis
 */
function rotatePoint(x, y, z, rotX, rotY) {
  // Rotate around Y axis
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  
  // Rotate around X axis
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y1 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  
  return [x1, y1, z2];
}

/**
 * Calculate normal using finite differences
 */
function calculateNormal(x, y, z) {
  const eps = 0.001;
  const dx = cubeSDF(x + eps, y, z, 1.0) - cubeSDF(x - eps, y, z, 1.0);
  const dy = cubeSDF(x, y + eps, z, 1.0) - cubeSDF(x, y - eps, z, 1.0);
  const dz = cubeSDF(x, y, z + eps, 1.0) - cubeSDF(x, y, z - eps, 1.0);
  
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return [dx / len, dy / len, dz / len];
}

/**
 * Ray marching function
 */
function rayMarch(origin, direction, rotationX, rotationY, maxSteps = 100, maxDist = 100, epsilon = 0.001) {
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
        // Calculate lighting
        const lightDir = [1, 1, -0.5];
        const lightLen = Math.sqrt(lightDir[0] * lightDir[0] + lightDir[1] * lightDir[1] + lightDir[2] * lightDir[2]);
        lightDir[0] /= lightLen;
        lightDir[1] /= lightLen;
        lightDir[2] /= lightLen;
        
        const dot = Math.max(0, 
          result.normal[0] * lightDir[0] + 
          result.normal[1] * lightDir[1] + 
          result.normal[2] * lightDir[2]
        );
        
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
  module.exports = { cubeSDF, rotatePoint, calculateNormal, rayMarch, render };
}
