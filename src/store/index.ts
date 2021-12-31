import { createStore } from 'redux'
import { GRID_WIDTH_X, VIEW_HOME } from '../constants'

import * as actions from './actions'

import VIEWS_DEFINITIONS from '../VIEWS_DEFINITIONS'
import { isIPadOS, isMobileBrowser } from '../helpers'

const isIpad = isIPadOS()
const isMobile = isMobileBrowser()

let targetCameraZ = 16
{
  const fov = (45 * Math.PI) / 180 // convert vertical fov to radians
  const h = 2 * Math.tan(fov / 2) * targetCameraZ // visible height
  const w = h * (innerWidth / innerHeight)
  if (GRID_WIDTH_X > w) {
    targetCameraZ *= (GRID_WIDTH_X / w) * 1.1
  }
}

const initialState = {
  touchDevice: isIpad || isMobile,

  debugMode: new URLSearchParams(location.search).has('debugMode'),

  isDarkMode: true,

  hasLoadedResources: false,
  loadedResourcesPercentage: 0,
  hasFinishedLoadingAnimation: false,

  activeViewName: null,
  hoveredItem: null,

  cameraX: 0,
  cameraY: 16,
  cameraZ: 18,

  targetCameraX: 0,
  targetCameraY: 0,
  targetCameraZ,

  lightX: 0,
  lightY: 3,
  lightZ: 5,

  pointLightShininess: 90,
  pointLightColor: [1, 1, 1],
  pointLightSpecularColor: [1, 1, 1],
  pointLightSpecularFactor: 0.05,

  shadowTextureMatrix: null,

  hoverIdx: -1,
  hoverItemStartX: -1,
  hoverItemEndX: -1,
  hoverItemY: -1,
}

const appState = (state = initialState, action) => {
  switch (action.type) {
    case actions.SET_IS_DARK_MODE: {
      return {
        ...state,
        isDarkMode: action.payload,
      }
    }
    case actions.SET_HAS_LOADED_RESOURCES: {
      return {
        ...state,
        hasLoadedResources: action.payload,
      }
    }

    case actions.SET_LOADED_RESOURCES_PERCENTAGE: {
      return {
        ...state,
        loadedResourcesPercentage: action.payload,
      }
    }

    case actions.SET_HAS_FINISHED_LOADING_ANIMATION: {
      return {
        ...state,
        hasFinishedLoadingAnimation: action.payload,
      }
    }

    case actions.SET_ACTIVE_VIEW: {
      const { activeViewName, shouldPush } = action.payload
      const { label } = VIEWS_DEFINITIONS[activeViewName]
      if (activeViewName === VIEW_HOME) {
        document.title = `Georgi Nikolov`
        if (shouldPush) {
          history.pushState({}, '', '/')
        }
      } else {
        document.title = `${label} - Georgi Nikolov`
        if (shouldPush) {
          const slug = activeViewName
          const { parent } = VIEWS_DEFINITIONS[activeViewName]
          history.pushState({}, '', `${parent ? `/${parent}` : ''}/${slug}`)
        }
      }

      return {
        ...state,
        activeViewName,
      }
    }

    case actions.SET_CAMERA_X: {
      return {
        ...state,
        cameraX: action.payload,
      }
    }

    case actions.SET_CAMERA_Y: {
      return {
        ...state,
        cameraY: action.payload,
      }
    }

    case actions.SET_CAMERA_Z: {
      return {
        ...state,
        cameraZ: action.payload,
      }
    }

    case actions.SET_LIGHT_X: {
      return {
        ...state,
        lightX: action.payload,
      }
    }

    case actions.SET_LIGHT_Y: {
      return {
        ...state,
        lightY: action.payload,
      }
    }

    case actions.SET_LIGHT_Z: {
      return {
        ...state,
        lightZ: action.payload,
      }
    }

    case actions.SET_POINT_LIGHT_SHININESS: {
      return {
        ...state,
        pointLightShininess: action.payload,
      }
    }

    case actions.SET_POINT_LIGHT_COLOR: {
      return {
        ...state,
        pointLightColor: action.payload,
      }
    }

    case actions.SET_POINT_LIGHT_SPECULAR_COLOR: {
      return {
        ...state,
        pointLightSpecularColor: action.payload,
      }
    }

    case actions.SET_POINT_LIGHT_SPECULAR_FACTOR: {
      return {
        ...state,
        pointLightSpecularFactor: action.payload,
      }
    }

    case actions.SET_SHADOW_TEXTURE_MATRIX: {
      return {
        ...state,
        shadowTextureMatrix: action.payload,
      }
    }

    case actions.SET_HOVERED_ITEM: {
      if (action.payload !== state.hoveredItem) {
        if (action.payload) {
          document.body.classList.add('isHovering')
        } else {
          document.body.classList.remove('isHovering')
        }
      }
      return {
        ...state,
        hoveredItem: action.payload,
      }
    }

    case actions.SET_HOVERED_IDX: {
      return {
        ...state,
        hoverIdx: action.payload,
      }
    }

    case actions.SET_HOVER_ITEM_START_X: {
      return {
        ...state,
        hoverItemStartX: action.payload,
      }
    }

    case actions.SET_HOVER_ITEM_END_X: {
      return {
        ...state,
        hoverItemEndX: action.payload,
      }
    }

    case actions.SET_HOVER_ITEM_Y: {
      return {
        ...state,
        hoverItemY: action.payload,
      }
    }

    default: {
      return state
    }
  }
}

export default createStore(appState)
