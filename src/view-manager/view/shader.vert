#ifdef IS_FRONT_VIEW
  struct PointLightBase {
    float shininess;
    vec3 lightColor;
    vec3 specularColor;
    float specularFactor;
    vec3 worldPosition;
  };

  uniform PointLightBase PointLight;
  uniform vec2 cellSize;
  uniform mat4 shadowTextureMatrix;

  attribute vec2 uv;
  attribute float shadedMixFactor;
  attribute float colorScaleFactor;
  attribute vec4 textColor;

  varying vec2 v_uv;
  varying vec4 v_projectedShadowUvs;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;
  varying float v_shadedMixFactor;
  varying float v_colorScaleFactor;
  varying vec4 v_textColor;

#else
  attribute vec4 sideColor;

  varying vec4 v_sideColor;
#endif

uniform vec3 eyePosition;

attribute float instanceIndex;
attribute vec4 position;
attribute vec3 normal;
attribute mat4 instanceModelMatrix;
  
varying vec3 v_normal;
varying vec3 v_worldPosition;
varying float v_instanceIndex;

void main () {
  mat4 worldMatrix = modelMatrix * instanceModelMatrix;
  vec4 worldPosition = worldMatrix * position;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;

  v_normal = mat3(worldMatrix) * normal;
  v_worldPosition = worldPosition.xyz;
  v_instanceIndex = instanceIndex;

  #ifdef IS_FRONT_VIEW
    float texOffsetY = mod(instanceIndex, cellSize.y);
    float texOffsetX = ceil(instanceIndex / cellSize.x) - 1.0;
    v_uv = uv *
           vec2(1.0 / cellSize.x, 1.0 / cellSize.y) +
           vec2(texOffsetX / cellSize.x, texOffsetY / cellSize.y);
    v_projectedShadowUvs = shadowTextureMatrix * worldPosition;

    v_surfaceToLight = PointLight.worldPosition - worldPosition.xyz;
    v_surfaceToView = eyePosition - worldPosition.xyz;

    v_shadedMixFactor = shadedMixFactor;
    v_colorScaleFactor = colorScaleFactor;

    v_textColor = textColor;
  #else
    v_sideColor = sideColor;
  #endif

}
