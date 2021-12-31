precision highp float;

const float CUBES_COUNT = 361.0;

#ifdef IS_FRONT_VIEW
  struct PointLightBase {
    float shininess;
    vec3 lightColor;
    vec3 specularColor;
    float specularFactor;
    vec3 worldPosition;
  };

  uniform PointLightBase PointLight;
  uniform sampler2D text;
  uniform sampler2D projectedShadowTexture;
  uniform samplerCube skyboxTexture;
  
  varying vec2 v_uv;
  varying vec4 v_projectedShadowUvs;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;
  varying float v_shadedMixFactor;
  varying float v_colorScaleFactor;
  varying vec4 v_textColor;
#else
  uniform samplerCube skyboxTexture;

  varying vec4 v_sideColor;
#endif

uniform vec3 eyePosition;
uniform bool solidColor;
varying vec3 v_normal;
varying vec3 v_worldPosition;
varying float v_instanceIndex;

void main () {
  if (solidColor) {
    gl_FragColor = vec4(1.0, 0.5, 0.5, 1.0);
  } else {

    vec3 normal = normalize(v_normal);
    
    #ifdef IS_FRONT_VIEW
      // Shadow
      float shadowBias = -0.001;
      vec3 projectedTexcoord = v_projectedShadowUvs.xyz / v_projectedShadowUvs.w;
      float currentDepth = projectedTexcoord.z + shadowBias;

      float shadow = 0.0;
      vec2 texelSize = 1.0 / vec2(DEPTH_TEXTURE_WIDTH, DEPTH_TEXTURE_HEIGHT);
      
      #pragma unroll 3
      for(int x = -1; x <= 1; ++x) {
          #pragma unroll 3
          for(int y = -1; y <= 1; ++y) {
              float pcfDepth = texture2D(projectedShadowTexture, projectedTexcoord.xy + vec2(x, y) * texelSize).r; 
              shadow += currentDepth > pcfDepth ? 0.7 : 1.0;
          }    
      }
      shadow /= 9.0;

      // Point lighting
      vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
      vec3 surfaceToViewDirection = normalize(v_surfaceToView);

      vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
      float pointLight = dot(normal, surfaceToLightDirection);
      float specular = 0.0;

      if (pointLight > 0.0) {
        specular = pow(dot(normal, halfVector), PointLight.shininess);
      }

      // Main color
      vec2 uv = vec2(v_uv.x, v_uv.y);
      vec4 texColor = texture2D(text, uv);
      float textMixFactor = texColor.a;
      vec3 bgColor = vec3(1.0, 1.0, 1.0) * v_colorScaleFactor;
      vec4 textColor = mix(
        vec4(bgColor, 1.0),
        v_textColor,
        textMixFactor
      );
      vec4 atlasColor = mix(texColor, textColor, v_shadedMixFactor);

      
      // Shaded color
      vec4 shadedColor = atlasColor;
      shadedColor.rgb *= pointLight * PointLight.lightColor;
      shadedColor.rgb += specular * PointLight.specularColor * PointLight.specularFactor;
      shadedColor.rgb *= shadow;
      gl_FragColor = mix(atlasColor, shadedColor, v_shadedMixFactor);

      // Skybox color
      vec3 eyeToSurfaceDir = normalize(v_worldPosition - eyePosition);
      // vec3 direction = refract(eyeToSurfaceDir, normal, 1.0 / v_colorScaleFactor);
      vec3 direction = reflect(eyeToSurfaceDir, normal);

      vec4 cubeColor = textureCube(skyboxTexture, direction);

      gl_FragColor = mix(gl_FragColor, cubeColor, v_shadedMixFactor * 0.115);

    #else
      // Sides color
      vec3 eyeToSurfaceDir = normalize(v_worldPosition - eyePosition);
      // vec3 direction = refract(eyeToSurfaceDir, normal, v_instanceIndex / CUBES_COUNT);
      vec3 direction = reflect(eyeToSurfaceDir, normal);

      vec4 cubeColor = textureCube(skyboxTexture, direction);
      gl_FragColor = mix(v_sideColor, cubeColor, 0.9);
      // gl_FragColor = cubeColor;
    #endif
  }
}
