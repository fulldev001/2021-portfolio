import { mat4, ReadonlyMat4, vec3 } from 'gl-matrix'
import { animate } from 'popmotion'

import {
  Mesh,
  Geometry,
  GeometryUtils,
  InstancedMesh,
  PerspectiveCamera,
  Texture,
  CubeTexture,
  UNIFORM_TYPE_INT,
  UNIFORM_TYPE_VEC2,
  CUBE_SIDE_FRONT,
  UNIFORM_TYPE_FLOAT,
  UNIFORM_TYPE_MATRIX4X4,
  UNIFORM_TYPE_VEC3,
  mapNumberRange,
  clamp,
  CUBE_SIDE_BACK,
} from '../../lib/hwoa-rang-gl/dist/esm'

import store from '../../store'
import {
  setHoverItemStartX,
  setHoverItemEndX,
  setHoverItemY,
  setHoveredItem,
} from '../../store/actions'

import {
  DEPTH_TEXTURE_WIDTH,
  DEPTH_TEXTURE_HEIGHT,
  GRID_COUNT_X,
  GRID_COUNT_Y,
  GRID_STEP_X,
  GRID_STEP_Y,
  GRID_TOTAL_COUNT,
  GRID_WIDTH_X,
  GRID_WIDTH_Y,
  CONTENT_TYPE_TEXT,
  CONTENT_TYPE_SPLIT_TEXT,
  CONTENT_TYPE_IMAGE,
  POSSIBLE_SIDE_COLORS,
} from '../../constants'

import vertexShaderSource from './shader.vert'
import fragmentShaderSource from './shader.frag'
import TextureManager from '../../texture-manager'

export default class View {
  #gl: WebGLRenderingContext
  #textTexture: Texture
  #textureManager: TextureManager
  #idx: number
  #viewDefinition

  #meshes: Array<Mesh> = []

  #positionsOffsetsZ = new Float32Array(GRID_TOTAL_COUNT).fill(0)
  #scaleOffsets = new Float32Array(GRID_TOTAL_COUNT).fill(0)
  #animationOffsets = new Float32Array(GRID_TOTAL_COUNT).fill(0)
  #shadedMixFactors = new Float32Array(GRID_TOTAL_COUNT).fill(1)
  #textColors = new Float32Array(GRID_TOTAL_COUNT * 3).fill(0)
  #eyePosition: number[]

  #instanceMatrix = mat4.create()
  #transformVec3 = vec3.create()

  #posZ = 0

  #isTweeningScaleZ = false
  #tweenForScaleZ
  #emptyTexture: Texture

  static posZInitial = 0
  static posZHover = GRID_STEP_Y * 0.9
  static transitionDuration = 750

  static normalizeColor(color: number): number {
    return color / 255
  }

  constructor(
    gl: WebGLRenderingContext,
    { idx, textureManager }: { idx: number; textureManager: TextureManager },
  ) {
    this.#idx = idx
    this.#gl = gl
    this.#textureManager = textureManager

    this.#emptyTexture = new Texture(gl).bind().fromSize(1, 1).unbind()

    this.#textTexture = new Texture(gl, {
      format: gl.RGBA,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.NEAREST,
    })

    const faces = GeometryUtils.createBoxSeparateFace({
      width: GRID_STEP_X,
      height: GRID_STEP_Y,
      depth: GRID_STEP_Y,
      radius: 0.01,
    })

    faces
      .filter(({ orientation }) => orientation !== CUBE_SIDE_BACK)
      .forEach((side) => {
        const { orientation, vertices, normal, uv, indices } = side
        const instancedIndexes = new Float32Array(GRID_TOTAL_COUNT)
        for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
          instancedIndexes[i] = i
        }

        const geometry = new Geometry(gl)
          .addIndex({ typedArray: indices })
          .addAttribute('position', {
            size: 3,
            typedArray: vertices,
          })
          .addAttribute('normal', {
            size: 3,
            typedArray: normal,
          })

          .addAttribute('instanceIndex', {
            size: 1,
            typedArray: instancedIndexes,
            instancedDivisor: 1,
          })

        if (orientation === CUBE_SIDE_FRONT) {
          const colorMixFactors = new Float32Array(GRID_TOTAL_COUNT)

          for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
            colorMixFactors[i] = 0.95 + Math.random() * 0.05
          }
          geometry
            .addAttribute('uv', {
              size: 2,
              typedArray: uv,
            })
            .addAttribute('shadedMixFactor', {
              size: 1,
              typedArray: this.#shadedMixFactors,
              instancedDivisor: 1,
            })
            .addAttribute('colorScaleFactor', {
              size: 1,
              typedArray: colorMixFactors,
              instancedDivisor: 1,
            })
            .addAttribute('textColor', {
              size: 3,
              typedArray: this.#textColors,
              instancedDivisor: 1,
            })
        }

        let mesh

        const lightDirection = vec3.create()
        vec3.set(lightDirection, 0, 0, 10)
        vec3.normalize(lightDirection, lightDirection)

        const {
          cameraX,
          cameraY,
          cameraZ,
          lightX,
          lightY,
          lightZ,
          pointLightShininess,
          pointLightColor,
          pointLightSpecularColor,
          pointLightSpecularFactor,
        } = store.getState()

        this.#eyePosition = [cameraX, cameraY, cameraZ]

        const sharedUniforms = {
          solidColor: { type: UNIFORM_TYPE_FLOAT, value: 1 },
          skyboxTexture: { type: UNIFORM_TYPE_INT, value: 2 },
          eyePosition: {
            type: UNIFORM_TYPE_VEC3,
            value: [cameraX, cameraY, cameraZ],
          },
          'PointLight.worldPosition': {
            type: UNIFORM_TYPE_VEC3,
            value: [lightX, lightY, lightZ],
          },
          'PointLight.shininess': {
            type: UNIFORM_TYPE_FLOAT,
            value: pointLightShininess,
          },
          'PointLight.lightColor': {
            type: UNIFORM_TYPE_VEC3,
            value: pointLightColor,
          },
          'PointLight.specularColor': {
            type: UNIFORM_TYPE_VEC3,
            value: pointLightSpecularColor,
          },
          'PointLight.specularFactor': {
            type: UNIFORM_TYPE_FLOAT,
            value: pointLightSpecularFactor,
          },
        }

        if (orientation === CUBE_SIDE_FRONT) {
          mesh = new InstancedMesh(gl, {
            geometry,

            uniforms: {
              ...sharedUniforms,
              text: { type: UNIFORM_TYPE_INT, value: 0 },
              projectedShadowTexture: { type: UNIFORM_TYPE_INT, value: 1 },
              cellSize: {
                type: UNIFORM_TYPE_VEC2,
                value: [GRID_COUNT_X, GRID_COUNT_Y],
              },
            },
            defines: {
              IS_FRONT_VIEW: 1,
              DEPTH_TEXTURE_WIDTH,
              DEPTH_TEXTURE_HEIGHT,
            },
            instanceCount: GRID_TOTAL_COUNT,
            vertexShaderSource: vertexShaderSource,
            fragmentShaderSource: fragmentShaderSource,
          })
        } else {
          const sideColors = new Float32Array(GRID_TOTAL_COUNT * 3)
          for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
            const randColor =
              POSSIBLE_SIDE_COLORS[
                Math.floor(Math.random() * POSSIBLE_SIDE_COLORS.length)
              ]
            sideColors[i * 3 + 0] = View.normalizeColor(randColor[0])
            sideColors[i * 3 + 1] = View.normalizeColor(randColor[1])
            sideColors[i * 3 + 2] = View.normalizeColor(randColor[2])
          }
          geometry.addAttribute('sideColor', {
            size: 3,
            typedArray: sideColors,
            instancedDivisor: 1,
          })

          mesh = new InstancedMesh(gl, {
            geometry,
            uniforms: {
              ...sharedUniforms,
              projectedShadowTexture: { type: UNIFORM_TYPE_INT, value: 0 },
            },
            defines: {
              DEPTH_TEXTURE_WIDTH,
              DEPTH_TEXTURE_HEIGHT,
            },
            instanceCount: GRID_TOTAL_COUNT,
            vertexShaderSource: vertexShaderSource,
            fragmentShaderSource: fragmentShaderSource,
          })
        }

        this.#meshes.push(mesh)
      })
  }

  setPosition(x = 0, y = 0, z = 0): this {
    this.#meshes.forEach((mesh) => {
      mesh.setPosition({ x, y, z })
    })
    return this
  }

  transitionIn = (offsetZ = 0): Promise<void> =>
    new Promise((resolve) => {
      for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
        this.#animationOffsets[i] = Math.random()
      }
      animate({
        // ease: circIn,
        duration: View.transitionDuration,
        onUpdate: (v) => {
          for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
            const offset = this.#animationOffsets[i]
            this.#positionsOffsetsZ[i] = clamp(
              mapNumberRange(v, offset, 1, -6 + offsetZ, 0),
              -6 + offsetZ,
              0,
            )
            this.#scaleOffsets[i] = v
          }
        },
        onComplete: () => {
          resolve(null)
        },
      })
    })

  transitionOut = (): Promise<void> =>
    new Promise((resolve) => {
      for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
        this.#animationOffsets[i] = Math.random()
      }
      animate({
        // ease: circOut,
        duration: View.transitionDuration,
        onUpdate: (v) => {
          for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
            const offset = this.#animationOffsets[i]
            this.#positionsOffsetsZ[i] = clamp(
              mapNumberRange(v, offset, 1, 0, 4),
              0,
              4,
            )
            this.#scaleOffsets[i] = 1 - v
          }
        },
        onComplete: () => {
          resolve(null)
        },
      })
    })

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  setView(viewDefiniton): this {
    this.#viewDefinition = viewDefiniton

    const image = viewDefiniton.find(({ type }) => type === CONTENT_TYPE_IMAGE)

    for (let i = 0; i < GRID_TOTAL_COUNT; i++) {
      const y = GRID_COUNT_Y - (i % GRID_COUNT_Y) - 1
      const x = i / GRID_COUNT_X

      if (image) {
        if (
          x >= image.x &&
          x < image.width &&
          y >= image.y &&
          y < image.height
        ) {
          this.#shadedMixFactors[i] = 0
        } else {
          this.#shadedMixFactors[i] = 1
        }
      } else {
        this.#shadedMixFactors[i] = 1
      }
      viewDefiniton.forEach((item) => {
        if (
          item.type === CONTENT_TYPE_TEXT ||
          item.type === CONTENT_TYPE_SPLIT_TEXT
        ) {
          if (x >= item.x && x < item.x + item.value.length && y === item.y) {
            this.#textColors[i * 3 + 0] = item.textColor
              ? View.normalizeColor(item.textColor[0])
              : 0.2
            this.#textColors[i * 3 + 1] = item.textColor
              ? View.normalizeColor(item.textColor[1])
              : 0.2
            this.#textColors[i * 3 + 2] = item.textColor
              ? View.normalizeColor(item.textColor[2])
              : 0.2
          }
        }
      })
    }
    const frontMesh = this.#meshes[this.#meshes.length - 1]
    frontMesh
      .updateGeometryAttribute(
        'shadedMixFactor',
        0,
        GRID_TOTAL_COUNT,
        this.#shadedMixFactors,
      )
      .updateGeometryAttribute(
        'textColor',
        0,
        GRID_TOTAL_COUNT,
        this.#textColors,
      )

    // this.#shadedMixFactors.fill(1)

    const canvas = this.#textureManager.getTextureCanvas(
      this.#idx,
      viewDefiniton,
    )
    this.#textTexture.bind().setIsFlip().fromImage(canvas).generateMipmap()
    return this
  }

  setHoveredIdx(hoveredIdx: number): string | null {
    const y = hoveredIdx % GRID_COUNT_Y
    const x = hoveredIdx / GRID_COUNT_X

    const hoveredItem = this.#viewDefinition.find(
      (item) =>
        x >= item.x &&
        x < item.x + item.value.length &&
        GRID_COUNT_Y - item.y - 1 === y,
    )

    if (hoveredItem && hoveredItem.link) {
      store.dispatch(setHoverItemStartX(hoveredItem.x))
      store.dispatch(setHoverItemEndX(hoveredItem.x + hoveredItem.value.length))
      store.dispatch(setHoverItemY(y))

      store.dispatch(setHoveredItem(hoveredItem.link))
      if (!this.#isTweeningScaleZ && this.#posZ === View.posZInitial) {
        this.#isTweeningScaleZ = true
        if (this.#tweenForScaleZ) {
          this.#tweenForScaleZ.stop()
        }
        this.#tweenForScaleZ = animate({
          duration: 100,
          onUpdate: (v) => {
            this.#posZ =
              View.posZInitial + v * (View.posZHover - View.posZInitial)
          },
          onComplete: () => {
            this.#isTweeningScaleZ = false
            this.#tweenForScaleZ = null
          },
        })
      }
    } else {
      if (!this.#isTweeningScaleZ && this.#posZ === View.posZHover) {
        this.#isTweeningScaleZ = true
        if (this.#tweenForScaleZ) {
          this.#tweenForScaleZ.stop()
        }
        this.#tweenForScaleZ = animate({
          duration: 100,
          onUpdate: (v) => {
            this.#posZ =
              View.posZHover - v * (View.posZHover - View.posZInitial)
          },
          onComplete: () => {
            this.#isTweeningScaleZ = false
            this.#tweenForScaleZ = null
            store.dispatch(setHoveredItem(null))
          },
        })
      }
    }
    return hoveredItem && hoveredItem.link
  }

  setShadowTextureMatrix(shadowTextureMatrix: ReadonlyMat4): this {
    this.#meshes.forEach((mesh) => {
      mesh
        .use()
        .setUniform(
          'shadowTextureMatrix',
          UNIFORM_TYPE_MATRIX4X4,
          shadowTextureMatrix,
        )
    })
    return this
  }

  updateMatrix(): void {
    const { hoverItemStartX, hoverItemEndX, hoverItemY } = store.getState()
    for (let x = 0; x < GRID_COUNT_X; x++) {
      for (let y = 0; y < GRID_COUNT_Y; y++) {
        const i = GRID_COUNT_X * x + y
        const posx = x * GRID_STEP_X - GRID_WIDTH_X / 2 + GRID_STEP_X / 2

        const posy = y * GRID_STEP_Y - GRID_WIDTH_Y / 2 + GRID_STEP_Y / 2

        let posz = 0 + this.#positionsOffsetsZ[i]

        if (x >= hoverItemStartX && x < hoverItemEndX && y === hoverItemY) {
          posz = this.#posZ + this.#positionsOffsetsZ[i]
        }

        const scalex = this.#scaleOffsets[i]
        const scaley = this.#scaleOffsets[i]
        const scalez = this.#scaleOffsets[i]
        // const scalez = Math.sqrt(posx * posx + posy * posy)

        mat4.identity(this.#instanceMatrix)

        vec3.set(this.#transformVec3, posx, posy, posz)
        mat4.translate(
          this.#instanceMatrix,
          this.#instanceMatrix,
          this.#transformVec3,
        )

        vec3.set(this.#transformVec3, scalex, scaley, scalez)
        mat4.scale(
          this.#instanceMatrix,
          this.#instanceMatrix,
          this.#transformVec3,
        )

        this.#meshes.forEach((mesh) =>
          // @ts-ignore
          mesh.setMatrixAt(i, this.#instanceMatrix),
        )
      }
    }
  }

  render(
    camera: PerspectiveCamera,
    renderAsSolidColor = false,
    shadowTexture: Texture = null,
    skyboxTexture: CubeTexture = null,
    deltaTime = 0,
  ): this {
    this.#meshes.forEach((mesh, i) => {
      if (renderAsSolidColor) {
        this.#gl.activeTexture(this.#gl.TEXTURE0)
        this.#emptyTexture.bind()
        this.#gl.activeTexture(this.#gl.TEXTURE1)
        this.#emptyTexture.bind()
      } else {
        const isFront = i === this.#meshes.length - 1
        if (isFront) {
          this.#gl.activeTexture(this.#gl.TEXTURE0)
          this.#textTexture.bind()
          this.#gl.activeTexture(this.#gl.TEXTURE1)
          shadowTexture.bind()
          this.#gl.activeTexture(this.#gl.TEXTURE2)
          skyboxTexture.bind()
        } else {
          this.#gl.activeTexture(this.#gl.TEXTURE2)
          skyboxTexture.bind()
        }
      }
      const { cameraX, cameraY, cameraZ } = store.getState()
      const eyeSpeed = deltaTime * 0.4
      this.#eyePosition[0] += (cameraX - this.#eyePosition[0]) * eyeSpeed
      this.#eyePosition[1] += (cameraY - this.#eyePosition[1]) * eyeSpeed
      this.#eyePosition[2] += (cameraZ - this.#eyePosition[2]) * eyeSpeed
      mesh
        .use()
        .setCamera(camera)
        .setUniform('eyePosition', UNIFORM_TYPE_VEC3, this.#eyePosition)
        .setUniform('solidColor', UNIFORM_TYPE_FLOAT, renderAsSolidColor)
        .draw()
    })
    return this
  }
}
