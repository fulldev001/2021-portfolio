attribute vec4 position;
attribute vec3 normal;
attribute mat4 instanceModelMatrix;
attribute float colorScaleFactor;

varying float v_colorScaleFactor;
varying vec3 v_normal;

void main () {
  vec4 worldPosition = modelMatrix * instanceModelMatrix * position;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
  
  v_colorScaleFactor = colorScaleFactor;
  v_normal = mat3(modelMatrix) * normal;
}
