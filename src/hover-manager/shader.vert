attribute vec4 position;
attribute vec4 id;
attribute mat4 instanceModelMatrix;

varying vec4 v_id;

void main () {
  gl_Position = projectionMatrix *
                viewMatrix *
                modelMatrix *
                instanceModelMatrix *
                position;

  v_id = id;
}
