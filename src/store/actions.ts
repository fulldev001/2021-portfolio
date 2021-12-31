import { PayloadAction } from '@reduxjs/toolkit'
import { ReadonlyMat4, ReadonlyVec3 } from 'gl-matrix'

export const SET_IS_DARK_MODE = 'SET_IS_DARK_MODE'
export const setIsDarkMode = (payload: boolean): PayloadAction<boolean> => ({
  type: SET_IS_DARK_MODE,
  payload,
})

export const SET_HAS_LOADED_RESOURCES = 'SET_HAS_LOADED_RESOURCES'
export const setHasLoadedResources = (
  payload: boolean,
): PayloadAction<boolean> => ({
  type: SET_HAS_LOADED_RESOURCES,
  payload,
})

export const SET_LOADED_RESOURCES_PERCENTAGE = 'SET_LOADED_RESOURCES_PERCENTAGE'
export const setLoadedResourcesPercentage = (
  payload: number,
): PayloadAction<number> => ({
  type: SET_LOADED_RESOURCES_PERCENTAGE,
  payload,
})

export const SET_HAS_FINISHED_LOADING_ANIMATION =
  'SET_HAS_FINISHED_LOADING_ANIMATION'
export const setHasFinishedLoadingAnimation = (
  payload: boolean,
): PayloadAction<boolean> => ({
  type: SET_HAS_FINISHED_LOADING_ANIMATION,
  payload,
})

export const SET_ACTIVE_VIEW = 'SET_ACTIVE_VIEW'
export const setActiveView = (
  activeViewName: string,
  shouldPush = true,
): PayloadAction<{ activeViewName: string; shouldPush: boolean }> => ({
  type: SET_ACTIVE_VIEW,
  payload: {
    activeViewName,
    shouldPush,
  },
})

export const SET_HOVERED_ITEM = 'SET_HOVERED_ITEM'
export const setHoveredItem = (
  payload: string | null,
): PayloadAction<string> => ({
  type: SET_HOVERED_ITEM,
  payload,
})

export const SET_HOVERED_IDX = 'SET_HOVERED_IDX'
export const setHoverIdx = (payload: number): PayloadAction<number> => ({
  type: SET_HOVERED_IDX,
  payload,
})

export const SET_HOVER_ITEM_START_X = 'SET_HOVER_ITEM_START_X'
export const setHoverItemStartX = (payload: number): PayloadAction<number> => ({
  type: SET_HOVER_ITEM_START_X,
  payload,
})

export const SET_HOVER_ITEM_END_X = 'SET_HOVER_ITEM_END_X'
export const setHoverItemEndX = (payload: number): PayloadAction<number> => ({
  type: SET_HOVER_ITEM_END_X,
  payload,
})

export const SET_HOVER_ITEM_Y = 'SET_HOVER_ITEM_Y'
export const setHoverItemY = (payload: number): PayloadAction<number> => ({
  type: SET_HOVER_ITEM_Y,
  payload,
})

export const SET_CAMERA_X = 'SET_CAMERA_X'
export const setCameraX = (payload: number): PayloadAction<number> => ({
  type: SET_CAMERA_X,
  payload,
})

export const SET_CAMERA_Y = 'SET_CAMERA_Y'
export const setCameraY = (payload: number): PayloadAction<number> => ({
  type: SET_CAMERA_Y,
  payload,
})

export const SET_CAMERA_Z = 'SET_CAMERA_Z'
export const setCameraZ = (payload: number): PayloadAction<number> => ({
  type: SET_CAMERA_Z,
  payload,
})

export const SET_LIGHT_X = 'SET_LIGHT_X'
export const setLightX = (payload: number): PayloadAction<number> => ({
  type: SET_LIGHT_X,
  payload,
})

export const SET_LIGHT_Y = 'SET_LIGHT_Y'
export const setLightY = (payload: number): PayloadAction<number> => ({
  type: SET_LIGHT_Y,
  payload,
})

export const SET_LIGHT_Z = 'SET_LIGHT_Z'
export const setLightZ = (payload: number): PayloadAction<number> => ({
  type: SET_LIGHT_Z,
  payload,
})

export const SET_POINT_LIGHT_SHININESS = 'SET_POINT_LIGHT_SHININESS'
export const setPointLightShininess = (
  payload: number,
): PayloadAction<number> => ({
  type: SET_POINT_LIGHT_SHININESS,
  payload,
})

export const SET_POINT_LIGHT_COLOR = 'SET_POINT_LIGHT_COLOR'
export const setPointLightColor = (
  payload: ReadonlyVec3,
): PayloadAction<ReadonlyVec3> => ({
  type: SET_POINT_LIGHT_COLOR,
  payload,
})

export const SET_POINT_LIGHT_SPECULAR_COLOR = 'SET_POINT_LIGHT_SPECULAR_COLOR'
export const setPointLightSpecularColor = (
  payload: ReadonlyVec3,
): PayloadAction<ReadonlyVec3> => ({
  type: SET_POINT_LIGHT_SPECULAR_COLOR,
  payload,
})

export const SET_POINT_LIGHT_SPECULAR_FACTOR = 'SET_POINT_LIGHT_SPECULAR_FACTOR'
export const setPointLightSpecularFactor = (
  payload: number,
): PayloadAction<number> => ({
  type: SET_POINT_LIGHT_SPECULAR_FACTOR,
  payload,
})

export const SET_SHADOW_TEXTURE_MATRIX = 'SET_SHADOW_TEXTURE_MATRIX'
export const setShadowTextureMatrix = (
  payload: ReadonlyMat4,
): PayloadAction<ReadonlyMat4> => ({
  type: SET_SHADOW_TEXTURE_MATRIX,
  payload,
})
