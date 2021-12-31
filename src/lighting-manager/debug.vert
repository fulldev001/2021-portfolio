attribute vec4 position;
attribute vec2 uv;

varying vec2 v_uv;

void main () {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;

  v_uv = uv;
}
