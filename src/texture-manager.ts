import {
  CONTENT_TYPE_SPLIT_TEXT,
  CONTENT_TYPE_TEXT,
  GRID_COUNT_X,
  GRID_COUNT_Y,
} from './constants'
import ResourceManager from './resource-manager'

const IDEAL_TEXTURE_SIZE = 2048

export default class TextureManager {
  #canvas0 = document.createElement('canvas')
  #ctx0 = this.#canvas0.getContext('2d')

  #canvas1 = document.createElement('canvas')
  #ctx1 = this.#canvas1.getContext('2d')

  #cellWidth: number
  #cellHeight: number
  #maxSize: number
  #idealFontSize: number

  #resourceManager: ResourceManager

  static FILL_STYLE = 'white'
  static FONT_STYLE = 'normal'
  static FONT_WEIGHT_BODY = 400
  static FONT_WEIGHT_HEADING = 400
  static DEFAULT_HEADING_FONT_FAMILY = 'Venus Rising'
  static DEFAULT_BODY_FONT_FAMILY = 'Space Mono'
  static DEFAULT_FONT_SIZE = 1

  static fitDimensions(contains: boolean) {
    return (
      parentWidth: number,
      parentHeight: number,
      childWidth: number,
      childHeight: number,
    ): { width: number; height: number; x: number; y: number } => {
      const doRatio = childWidth / childHeight
      const cRatio = parentWidth / parentHeight
      let width = parentWidth
      let height = parentHeight

      if (contains ? doRatio > cRatio : doRatio < cRatio) {
        height = width / doRatio
      } else {
        width = height * doRatio
      }

      return {
        width,
        height,
        x: (parentWidth - width) / 2,
        y: (parentHeight - height) / 2,
      }
    }
  }

  constructor({
    maxSize,
    idealFontSize,
    resourceManager,
  }: {
    maxSize: number
    idealFontSize: number
    resourceManager: ResourceManager
  }) {
    this.#resourceManager = resourceManager

    this.#canvas0.width = maxSize
    this.#canvas0.height = maxSize

    this.#canvas1.width = maxSize
    this.#canvas1.height = maxSize

    this.#maxSize = maxSize
    this.#idealFontSize = idealFontSize

    this.#cellWidth = this.#maxSize / GRID_COUNT_X
    this.#cellHeight = this.#maxSize / GRID_COUNT_Y
  }

  getTextureCanvas(
    idx: number,
    viewItems: Array<{
      type
      value
      fontSize
      x
      y
      fontFamily
      letterSpacing
      paddingLeft
      width
      height
    }>,
  ): HTMLCanvasElement {
    const ctx = idx === 0 ? this.#ctx0 : this.#ctx1
    const canvas = idx === 0 ? this.#canvas0 : this.#canvas1

    ctx.clearRect(0, 0, this.#maxSize, this.#maxSize)
    viewItems.forEach((item) => {
      if (item.type === CONTENT_TYPE_SPLIT_TEXT) {
        const x = item.x * this.#cellWidth + this.#cellWidth / 2
        const y = item.y * this.#cellHeight
        const count = item.value.length

        const fontSize =
          this.#idealFontSize *
          (this.#maxSize / IDEAL_TEXTURE_SIZE) *
          (item.fontSize || 1)

        const fontWeight = TextureManager.FONT_WEIGHT_BODY
        const fontFamily =
          item.fontFamily || TextureManager.DEFAULT_HEADING_FONT_FAMILY

        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = TextureManager.FILL_STYLE

        for (let i = 0; i < count; i++) {
          const char = item.value[i]
          const charX = i * this.#cellWidth
          const charY = y + this.#cellHeight * 0.6
          ctx.fillText(char, x + charX, charY)
        }
      } else if (item.type === CONTENT_TYPE_TEXT) {
        const paddingLeft = (item.paddingLeft || 0) * this.#cellWidth
        const x = item.x * this.#cellWidth + paddingLeft
        const y = item.y * this.#cellHeight + this.#cellHeight * 0.6

        const fontSize =
          this.#idealFontSize *
          (this.#maxSize / IDEAL_TEXTURE_SIZE) *
          (item.fontSize || TextureManager.DEFAULT_FONT_SIZE)

        const fontWeight = TextureManager.FONT_WEIGHT_BODY
        const fontFamily =
          item.fontFamily || TextureManager.DEFAULT_BODY_FONT_FAMILY

        const idealLetterSpacing = item.letterSpacing || 0
        const letterSpacing =
          idealLetterSpacing * (this.#maxSize / IDEAL_TEXTURE_SIZE)

        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = TextureManager.FILL_STYLE

        let accX = x

        for (let i = 0; i < item.value.length; i++) {
          const char = item.value.charAt(i)
          const charWidth = ctx.measureText(char).width
          ctx.fillText(char, accX, y)
          accX += charWidth + letterSpacing
        }

        // ctx.fillText(item.value, x, y)
      } else if (item.type === 'IMAGE') {
        const x = item.x * this.#cellWidth
        const y = item.y * this.#cellHeight

        const containerWidth = (item.width - item.x) * this.#cellWidth
        const containerHeight = (item.height - item.y) * this.#cellHeight

        const image = this.#resourceManager.getImage(item.value)

        const cover = TextureManager.fitDimensions(false)

        const {
          x: offsetX,
          y: offsetY,
          width,
          height,
        } = cover(
          containerWidth,
          containerHeight,
          image.naturalWidth,
          image.naturalHeight,
        )

        const drawX = x + offsetX
        const drawY = y + offsetY

        ctx.drawImage(image, drawX, drawY, width - offsetX, height - offsetY)
      }
    })
    return canvas
  }

  showDebug(scaleFactor = 1): this {
    const div = document.createElement('div')
    div.setAttribute('id', 'texture-manager-debug')
    div.setAttribute(
      'style',
      `
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 9999;
      pointer-events: none;
      transform-origin: 100% 100%;
      transform: scale(${scaleFactor});
    `,
    )

    this.#canvas0.setAttribute(
      'style',
      `
      border: 16px dotted red;
      margin-bottom: 62px;
    `,
    )

    div.appendChild(this.#canvas0)

    this.#canvas1.setAttribute(
      'style',
      `
      border: 16px dotted red;
    `,
    )

    div.appendChild(this.#canvas1)

    this.#ctx0.lineWidth = 3
    this.#ctx1.lineWidth = 3

    this.#ctx0.strokeStyle = 'white'
    this.#ctx1.strokeStyle = 'white'

    for (let x = 0; x < GRID_COUNT_X; x++) {
      for (let y = 0; y < GRID_COUNT_Y; y++) {
        this.#ctx0.strokeRect(
          x * this.#cellWidth,
          y * this.#cellHeight,
          this.#cellWidth,
          this.#cellHeight,
        )
        this.#ctx1.strokeRect(
          x * this.#cellWidth,
          y * this.#cellHeight,
          this.#cellWidth,
          this.#cellHeight,
        )
      }
    }

    document.body.appendChild(div)
    return this
  }
}
