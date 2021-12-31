import Stats from 'stats.js'

import {
  OrthographicCamera,
  PerspectiveCamera,
  CubeTexture,
} from './lib/hwoa-rang-gl/dist/esm'

import store from './store'
import {
  setActiveView,
  setCameraX,
  setCameraY,
  setCameraZ,
  setHoveredItem,
  setIsDarkMode,
  setLightX,
} from './store/actions'

import ResourceManager from './resource-manager'
import ViewManager from './view-manager'
import HoverManager from './hover-manager'
import LightingManager from './lighting-manager'
import LoadingScreen from './loading-screen'

import VIEWS_DEFINITIONS from './VIEWS_DEFINITIONS'

import {
  DEPTH_TEXTURE_WIDTH,
  DEPTH_TEXTURE_HEIGHT,
  VIEW_HOME,
  DESIRED_FPS,
  POSSIBLE_SKYBOXES,
  CONTENT_TYPE_IMAGE,
} from './constants'

import './index.css'
import { animate, anticipate } from 'popmotion'
import TextureManager from './texture-manager'
import { isInstagram } from './helpers'

// ------------------------------------------------

const SKYBOX_ASSETS =
  POSSIBLE_SKYBOXES[Math.floor(Math.random() * POSSIBLE_SKYBOXES.length)]

let oldTime = 0
let hasLoadedResources = false
let stats

const dpr = Math.min(2.5, devicePixelRatio)
const mousePosition = { x: -1000, y: -1000 }
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl')

const resourceManager = new ResourceManager()
const hoverManager = new HoverManager(gl)
const viewManager = new ViewManager(gl, {
  resourceManager,
})
const loadScreen = new LoadingScreen(gl)
const lightingManager = new LightingManager(gl)

const skyboxTexture = new CubeTexture(gl, {
  minFilter: gl.LINEAR_MIPMAP_LINEAR,
})

// Cameras setup
const camera = new PerspectiveCamera(
  (45 * Math.PI) / 180,
  innerWidth / innerHeight,
  0.1,
  100,
)
const orthoCamera = new OrthographicCamera(
  -innerWidth / 2,
  innerWidth / 2,
  innerHeight / 2,
  -innerHeight / 2,
  0.1,
  4,
)
{
  const { cameraX, cameraY, cameraZ } = store.getState()
  camera.position = [cameraX, cameraY, cameraZ]
  camera.lookAt([0, 0, 0])
}

{
  orthoCamera.position = [0, 0, 2]
  orthoCamera.lookAt([0, 0, 0])
}

{
  const { lightX, lightY, lightZ } = store.getState()
  lightingManager.position = [lightX, lightY, lightZ]
  lightingManager.computeShadowTextureMatrix()
}

// Debug FPS
{
  const { debugMode } = store.getState()
  if (debugMode) {
    stats = new Stats()
    document.body.appendChild(stats.domElement)
  }
}

// Init correct view based on url
{
  const viewName = getActiveViewFromURL()
  store.dispatch(setActiveView(viewName))
}

// Load fonts
resourceManager
  .addFontResource({
    type: ResourceManager.FONT_FACE,
    name: TextureManager.DEFAULT_HEADING_FONT_FAMILY,
    weight: TextureManager.FONT_WEIGHT_HEADING,
    style: TextureManager.FONT_STYLE,
  })
  .addFontResource({
    type: ResourceManager.FONT_GOOGLE,
    name: TextureManager.DEFAULT_BODY_FONT_FAMILY,
    weight: TextureManager.FONT_WEIGHT_BODY,
    style: TextureManager.FONT_STYLE,
  })

// Add a bit of delay to prevent stutter
resourceManager.addArtificialDelay(750)

// Load skyboxTexture sides
SKYBOX_ASSETS.forEach((url: string) => {
  resourceManager.addImageResource(url)
})

// Load project images
extractAllImageUrlsFromViews().forEach((url: string) => {
  resourceManager.addImageResource(url)
})
resourceManager.load()

// Instagram browser message
{
  if (isInstagram()) {
    const instaMessage = document.getElementById('insta-message')
    instaMessage.classList.add('visible')

    const closeInstaBtn = document.getElementById('close-insta-message')
    closeInstaBtn.addEventListener('click', onInstaCloseMessage)
  }
}

// Event Listeners
store.subscribe(onGlobalStateChange)
document.body.addEventListener('click', onMouseClick)
document.body.addEventListener('mousemove', onMouseMove)
document.body.addEventListener('touchstart', onTouchStart)
document.body.addEventListener('touchmove', onTouchMove)
window.addEventListener('resize', onResize)
window.onpopstate = onPopState
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', onColorPreferenceChange)

// Canvas setup
onResize(null, false)
document.body.appendChild(canvas)

// Start render loop
requestAnimationFrame(updateFrame)

function updateFrame(ts) {
  requestAnimationFrame(updateFrame)

  const state = store.getState()

  const { debugMode } = state

  if (debugMode) {
    stats.begin()
  }

  let dt = ts - oldTime
  oldTime = ts - (dt % (1 / DESIRED_FPS))

  dt /= 1000
  if (dt > 1) {
    dt = 1
  }

  // -------- Update camera position --------
  {
    const { cameraX, cameraY, cameraZ } = state
    const speed = dt * 3
    const x = camera.position[0] + (cameraX - camera.position[0]) * speed
    const y = camera.position[1] + (cameraY - camera.position[1]) * speed
    const z = camera.position[2] + (cameraZ - camera.position[2]) * speed
    camera.setPosition({ x, y, z }).updateViewMatrix()
  }

  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  {
    const { isDarkMode } = store.getState()
    if (isDarkMode) {
      gl.clearColor(0.2, 0.2, 0.2, 1)
    } else {
      gl.clearColor(0.8, 0.8, 0.8, 1)
    }
  }
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

  // -------- Render load screen --------
  const { hasFinishedLoadingAnimation } = state
  loadScreen.render(camera, dt)

  if (!hasFinishedLoadingAnimation) {
    return
  }

  // Update views positions
  {
    viewManager.updateMatrix()
  }

  // -------- Render shadow framebuffer --------
  {
    lightingManager.depthFramebuffer.bind()
    gl.viewport(0, 0, DEPTH_TEXTURE_WIDTH, DEPTH_TEXTURE_HEIGHT)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    viewManager.render(
      // @ts-ignore
      {
        projectionMatrix: lightingManager.lightProjectionMatrix,
        viewMatrix: lightingManager.shadowTextureWorldMatrixInv,
      },
      true,
      null,
      null,
      dt,
    )

    lightingManager.depthFramebuffer.unbind()
  }

  // Render correct view
  {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    viewManager.render(
      camera,
      false,
      lightingManager.depthFramebuffer.depthTexture,
      skyboxTexture,
      dt,
    )
  }

  // Render debug shadow mesh
  if (debugMode) {
    lightingManager.renderDebugMesh(orthoCamera)

    stats.end()
  }
}

// Event listeners
function onGlobalStateChange() {
  const state = store.getState()
  if (hasLoadedResources !== state.hasLoadedResources) {
    hasLoadedResources = true
    const {
      targetCameraX,
      targetCameraY,
      targetCameraZ,
      cameraX,
      cameraY,
      cameraZ,
    } = state
    animate({
      duration: 1000,
      ease: anticipate,
      onUpdate: (v) => {
        const x = cameraX + (targetCameraX - cameraX) * v
        const y = cameraY + (targetCameraY - cameraY) * v
        const z = cameraZ + (targetCameraZ - cameraZ) * v
        store.dispatch(setCameraX(x))
        store.dispatch(setCameraY(y))
        store.dispatch(setCameraZ(z))
      },
      onComplete: () => {
        // new CameraController(camera, document.body, true)
      },
    })
    const images: Array<HTMLImageElement> = SKYBOX_ASSETS.map((url: string) =>
      resourceManager.getImage(url),
    )
    skyboxTexture.bind().addSides(images).generateMipmap().unbind()
  }
}

function onMouseClick(e) {
  e.preventDefault()

  const state = store.getState()
  const { touchDevice } = state

  if (touchDevice) {
    hoverManager.determineHoveredIdx(camera, mousePosition.x, mousePosition.y)
    const { hoverIdx } = store.getState()
    const linkItem = viewManager.setHoveredIdx(hoverIdx)

    if (!linkItem) {
      return
    }

    if (linkItem.startsWith('https')) {
      window.open(linkItem, '_blank')
    } else if (linkItem.startsWith('mailto')) {
      window.open(linkItem)
    } else {
      store.dispatch(setActiveView(linkItem))
    }

    mousePosition.x = -2000
    mousePosition.y = -2000

    hoverManager.determineHoveredIdx(camera, mousePosition.x, mousePosition.y)
    viewManager.setHoveredIdx(hoverIdx)

    store.dispatch(setHoveredItem(null))
  } else {
    const { hoveredItem } = store.getState()
    if (!hoveredItem) {
      return
    }
    if (hoveredItem.startsWith('https')) {
      window.open(hoveredItem, '_blank')
    } else if (hoveredItem.startsWith('mailto')) {
      window.open(hoveredItem)
    } else {
      store.dispatch(setActiveView(hoveredItem))
    }
  }
}

function onMouseMove(e) {
  e.preventDefault()
  const state = store.getState()
  const { hasFinishedLoadingAnimation } = state

  mousePosition.x = e.clientX
  mousePosition.y = e.clientY

  const normMouseX = (mousePosition.x / innerWidth) * 2 - 1
  const normMouseY = (mousePosition.y / innerHeight) * 2 - 1

  if (!hasFinishedLoadingAnimation) {
    return null
  }

  const mouseScaleX = 9
  const mouseScaleY = 9
  store.dispatch(setCameraX(normMouseX * mouseScaleX))
  store.dispatch(setCameraY(normMouseY * mouseScaleY))
  store.dispatch(setLightX(normMouseX))

  hoverManager.determineHoveredIdx(camera, mousePosition.x, mousePosition.y)
  const { hoverIdx } = store.getState()
  viewManager.setHoveredIdx(hoverIdx)
}

function onTouchStart(e) {
  e.preventDefault()
  e.stopPropagation()
}

function onTouchMove(e) {
  e.preventDefault()
  e.stopPropagation()
}

function onPopState() {
  const viewName = getActiveViewFromURL()
  store.dispatch(setActiveView(viewName, false))
}

function onResize(e, updateProjectionMatrix = true) {
  if (updateProjectionMatrix) {
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
  }
  sizeCanvas()
}

function onInstaCloseMessage(e) {
  const instaMessage = document.getElementById('insta-message')
  instaMessage.classList.remove('visible')
  e.target.removeEventListener('click', onInstaCloseMessage)
}

function onColorPreferenceChange(e) {
  const isDarkMode = e.matches
  store.dispatch(setIsDarkMode(isDarkMode))
}

// Helpers
function extractAllImageUrlsFromViews(): Array<string> {
  const allImagesInProject = []
  for (const view of Object.values(VIEWS_DEFINITIONS)) {
    const images = (view.items as Array<{ type; value }>)
      .filter(({ type }) => type === CONTENT_TYPE_IMAGE)
      .map(({ value }) => value)
    allImagesInProject.push(...images)
  }
  return allImagesInProject
}

function sizeCanvas() {
  canvas.width = innerWidth * dpr
  canvas.height = innerHeight * dpr
  canvas.style.setProperty('width', `${innerWidth}px`)
  canvas.style.setProperty('height', `${innerHeight}px`)
}

function getActiveViewFromURL(url = location.pathname) {
  const urlFragments = url.split('/')
  let viewName = urlFragments[urlFragments.length - 1]
  if (!viewName) {
    viewName = VIEW_HOME
  }
  return viewName
}
