import { mat4 } from 'gl-matrix'
import {
  PerspectiveCamera,
  Texture,
  CubeTexture,
} from '../lib/hwoa-rang-gl/dist/esm'
import store from '../store'

import TextureManager from '../texture-manager'
import ResourceManager from '../resource-manager'
import View from './view'

import VIEWS_DEFINITIONS from '../VIEWS_DEFINITIONS'

export default class ViewManager {
  #view0: View
  #view1: View
  #textureManager: TextureManager
  #shadowTextureMatrix: mat4

  #viewDefinition: Object
  #activeViewName: string

  #isTransitioning = false
  #activeViewIdx: number

  constructor(
    gl: WebGLRenderingContext,
    { resourceManager }: { resourceManager: ResourceManager },
  ) {
    this.#textureManager = new TextureManager({
      idealFontSize: 80,
      maxSize: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048),
      resourceManager,
    })
    const state = store.getState()
    if (state.debugMode) {
      this.#textureManager.showDebug(0.1)
    }

    this.#view0 = new View(gl, {
      idx: 0,
      textureManager: this.#textureManager,
    })

    this.#view1 = new View(gl, {
      idx: 1,
      textureManager: this.#textureManager,
    })

    store.subscribe(this.onGlobalStateChange)
  }

  private onGlobalStateChange = () => {
    const state = store.getState()
    const { activeViewName, shadowTextureMatrix, hasFinishedLoadingAnimation } =
      state

    if (!hasFinishedLoadingAnimation) {
      return
    }

    if (activeViewName) {
      if (this.#activeViewName) {
        if (activeViewName !== this.#activeViewName) {
          this.setActiveView(VIEWS_DEFINITIONS[activeViewName].items)
          // this.resetPosZ()
          this.#activeViewName = activeViewName
        }
      } else {
        this.setActiveView(VIEWS_DEFINITIONS[activeViewName].items, false)
        // this.resetPosZ()
        this.#activeViewName = activeViewName
      }
    }

    if (shadowTextureMatrix) {
      if (this.#shadowTextureMatrix) {
        if (!mat4.equals(shadowTextureMatrix, this.#shadowTextureMatrix)) {
          this.#view0.setShadowTextureMatrix(shadowTextureMatrix)
          this.#view1.setShadowTextureMatrix(shadowTextureMatrix)
          this.#shadowTextureMatrix = shadowTextureMatrix
        }
      } else {
        this.#view0.setShadowTextureMatrix(shadowTextureMatrix)
        this.#view1.setShadowTextureMatrix(shadowTextureMatrix)
        this.#shadowTextureMatrix = shadowTextureMatrix
      }
    }
  }

  setHoveredIdx(hoveredIdx: number): string | null {
    if (this.#activeViewIdx === 0) {
      return this.#view0.setHoveredIdx(hoveredIdx)
    } else {
      return this.#view1.setHoveredIdx(hoveredIdx)
    }
  }

  setActiveView = (viewDefiniton: Object, fadeOutLastView = true) => {
    const oldViewDefinition = this.#viewDefinition
    this.#view0.setView(
      this.#activeViewIdx === 0
        ? oldViewDefinition || viewDefiniton
        : viewDefiniton,
    )
    this.#view1.setView(
      this.#activeViewIdx === 0
        ? viewDefiniton
        : oldViewDefinition || viewDefiniton,
    )

    this.#isTransitioning = true

    let promise

    if (fadeOutLastView) {
      promise = Promise.all(
        this.#activeViewIdx === 0
          ? [this.#view0.transitionOut(), this.#view1.transitionIn()]
          : [this.#view0.transitionIn(), this.#view1.transitionOut()],
      )
    } else {
      promise = this.#view0.transitionIn(-4)
    }

    promise.then(() => {
      this.#isTransitioning = false
      if (this.#activeViewIdx == null) {
        this.#activeViewIdx = 0
      } else {
        this.#activeViewIdx = this.#activeViewIdx === 0 ? 1 : 0
      }
    })

    this.#viewDefinition = viewDefiniton
  }

  updateMatrix(): this {
    if (this.#isTransitioning) {
      this.#view0.updateMatrix()
      this.#view1.updateMatrix()
    } else {
      if (this.#activeViewIdx === 0) {
        this.#view0.updateMatrix()
      } else {
        this.#view1.updateMatrix()
      }
    }
    return this
  }

  render(
    camera: PerspectiveCamera,
    renderAsSolidColor = false,
    shadowTexture: Texture = null,
    skyboxTexture: CubeTexture = null,
    deltaTime: number,
  ): this {
    const { hoverIdx } = store.getState()
    this.setHoveredIdx(hoverIdx)
    if (this.#isTransitioning) {
      this.#view0.render(
        camera,
        renderAsSolidColor,
        shadowTexture,
        skyboxTexture,
        deltaTime,
      )
      this.#view1.render(
        camera,
        renderAsSolidColor,
        shadowTexture,
        skyboxTexture,
        deltaTime,
      )
    } else {
      if (this.#activeViewIdx === 0) {
        this.#view0.render(
          camera,
          renderAsSolidColor,
          shadowTexture,
          skyboxTexture,
          deltaTime,
        )
      } else {
        this.#view1.render(
          camera,
          renderAsSolidColor,
          shadowTexture,
          skyboxTexture,
          deltaTime,
        )
      }
    }
    return this
  }
}
