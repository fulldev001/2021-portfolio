import { mat4, ReadonlyVec3, vec3 } from 'gl-matrix'
import { DEPTH_TEXTURE_HEIGHT, DEPTH_TEXTURE_WIDTH } from '../constants'
import {
  Framebuffer,
  Geometry,
  GeometryUtils,
  Mesh,
  OrthographicCamera,
  UNIFORM_TYPE_FLOAT,
  UNIFORM_TYPE_INT,
} from '../lib/hwoa-rang-gl/dist/esm'

import store from '../store'
import { setShadowTextureMatrix } from '../store/actions'

import vertexShaderSource from './debug.vert'
import fragmentShaderSource from './debug.frag'

export default class LightingManager {
  static UP_VECTOR: ReadonlyVec3 = [0, 1, 0]

  #gl: WebGLRenderingContext

  lightWorldMatrix = mat4.create()
  lightProjectionMatrix = mat4.create()
  shadowTextureMatrix = mat4.create()
  shadowTextureWorldMatrixInv = mat4.create()

  position = [0, 0, 0]
  lookAt = [0, 0, 0]

  shadowFoV: number
  shadowNear: number
  shadowFar: number

  #depthDebugMesh: Mesh
  depthFramebuffer: Framebuffer

  constructor(
    gl: WebGLRenderingContext,
    {
      position = [0, 0, 0],
      lookAt = [0, 0, 0],
      shadowFoV = 150,
      shadowNear = 0.5,
      shadowFar = 30,
    } = {},
  ) {
    this.#gl = gl

    this.position = position
    this.lookAt = lookAt
    this.shadowFoV = shadowFoV
    this.shadowNear = shadowNear
    this.shadowFar = shadowFar

    this.depthFramebuffer = new Framebuffer(gl, {
      width: DEPTH_TEXTURE_WIDTH,
      height: DEPTH_TEXTURE_HEIGHT,
      useDepthRenderBuffer: false,
    })

    {
      const width = innerWidth * 0.2
      const height = innerHeight * 0.2
      const { indices, vertices, uv } = GeometryUtils.createPlane({
        width,
        height,
      })
      const geometry = new Geometry(gl)
        .addIndex({ typedArray: indices })
        .addAttribute('position', { typedArray: vertices, size: 3 })
        .addAttribute('uv', { typedArray: uv, size: 2 })
      this.#depthDebugMesh = new Mesh(gl, {
        geometry,
        uniforms: {
          depthTex: { type: UNIFORM_TYPE_INT, value: 0 },
          nearPlane: { type: UNIFORM_TYPE_FLOAT, value: this.shadowNear },
          farPlane: { type: UNIFORM_TYPE_FLOAT, value: this.shadowFar },
        },
        vertexShaderSource,
        fragmentShaderSource,
      })
      this.#depthDebugMesh.setPosition({
        x: -innerWidth / 2 + width / 2 + 20,
        y: -innerHeight / 2 + height / 2 + 20,
      })
    }
  }

  computeShadowTextureMatrix(): void {
    const position = vec3.fromValues(
      this.position[0],
      this.position[1],
      this.position[2],
    )
    const lookAtTarget = vec3.fromValues(
      this.lookAt[0],
      this.lookAt[1],
      this.lookAt[2],
    )

    mat4.identity(this.shadowTextureMatrix)

    mat4.lookAt(
      this.lightWorldMatrix,
      position,
      lookAtTarget,
      LightingManager.UP_VECTOR,
    )
    mat4.invert(this.lightWorldMatrix, this.lightWorldMatrix)

    mat4.perspective(
      this.lightProjectionMatrix,
      (this.shadowFoV * Math.PI) / 180,
      1,
      this.shadowNear,
      this.shadowFar,
    )

    mat4.identity(this.shadowTextureWorldMatrixInv)

    mat4.invert(this.shadowTextureWorldMatrixInv, this.lightWorldMatrix)

    const transformVec = vec3.create()
    vec3.set(transformVec, 0.5, 0.5, 0.5)
    mat4.translate(
      this.shadowTextureMatrix,
      this.shadowTextureMatrix,
      transformVec,
    )
    mat4.scale(this.shadowTextureMatrix, this.shadowTextureMatrix, transformVec)
    mat4.mul(
      this.shadowTextureMatrix,
      this.shadowTextureMatrix,
      this.lightProjectionMatrix,
    )
    mat4.mul(
      this.shadowTextureMatrix,
      this.shadowTextureMatrix,
      this.shadowTextureWorldMatrixInv,
    )
    store.dispatch(setShadowTextureMatrix(this.shadowTextureMatrix))
  }

  renderDebugMesh(camera: OrthographicCamera): void {
    this.#gl.activeTexture(this.#gl.TEXTURE0)
    this.depthFramebuffer.depthTexture.bind()
    this.#depthDebugMesh.use().setCamera(camera).draw()
  }
}
