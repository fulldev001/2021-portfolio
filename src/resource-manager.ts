import WebFont from 'webfontloader'

import store from './store'
import {
  setHasLoadedResources,
  setLoadedResourcesPercentage,
} from './store/actions'

export default class ResourceManager {
  #resourcesMap = new Map()
  #delayCounter = 0

  static FONT_FACE = 'font-woff'
  static FONT_GOOGLE = 'google-font'
  static IMAGE = 'img'
  static ARTIFICIAL_DELAY = 'delay'

  static getFVD(weight: string | number, style: string): string {
    let output = ''
    if (weight === 400 || weight === 'normal') {
      output += 'n:'
    }
    if (style === 'normal') {
      output += '4'
    }
    return output
  }

  static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      console.log(url)
      image.onload = () => {
        resolve(image)
      }
      image.onerror = (error) => reject({ error })
      image.src = url
    })
  }

  static loadWoffFont(
    name: string,
    weight: string | number,
    style: string,
  ): Promise<string> {
    const fvd = ResourceManager.getFVD(weight, style)
    const fontFamily = `${name}:${fvd}`
    return new Promise((resolve, reject) => {
      WebFont.load({
        custom: {
          families: [fontFamily],
        },
        active: () => {
          resolve(fontFamily)
        },
        fontinactive: () => {
          reject()
        },
      })
    })
  }

  static loadGoogleFont(
    name: string,
    weight: string | number,
  ): Promise<string> {
    const fontFamily = `${name}:${weight}:latin`
    return new Promise((resolve, reject) => {
      WebFont.load({
        google: {
          families: [fontFamily],
        },
        active: () => {
          resolve(fontFamily)
        },
        fontinactive: () => {
          reject()
        },
      })
    })
  }

  getImage(resourceName: string): HTMLImageElement {
    const resource = this.#resourcesMap.get(resourceName)
    if (resource) {
      return resource.image
    } else {
      console.error('Could not locate resource')
    }
  }

  addFontResource(resourceAux: {
    type: string
    name: string
    weight: number
    style: string
  }): this {
    const { name } = resourceAux
    this.#resourcesMap.set(name, resourceAux)
    return this
  }

  addImageResource(imageUrl: string): this {
    this.#resourcesMap.set(imageUrl, {
      type: ResourceManager.IMAGE,
    })
    return this
  }

  addArtificialDelay(delay: number): this {
    const key = `DELAY_${this.#delayCounter}`
    this.#resourcesMap.set(key, {
      type: ResourceManager.ARTIFICIAL_DELAY,
      delay,
    })
    this.#delayCounter++
    return this
  }

  load(): void {
    const promises = []
    let n = 0
    for (const [url, entry] of this.#resourcesMap.entries()) {
      let promise
      if (entry.type === ResourceManager.FONT_FACE) {
        promise = ResourceManager.loadWoffFont(
          entry.name,
          entry.weight,
          entry.style,
        )
      } else if (entry.type === ResourceManager.FONT_GOOGLE) {
        promise = ResourceManager.loadGoogleFont(entry.name, entry.weight)
      } else if (entry.type === ResourceManager.IMAGE) {
        promise = ResourceManager.loadImage(url).then((img) => {
          entry.image = img
          return img
        })
      } else if (entry.type === ResourceManager.ARTIFICIAL_DELAY) {
        promise = new Promise((resolve) => setTimeout(resolve, entry.delay))
      }
      promise = promise.then((res) => {
        store.dispatch(
          setLoadedResourcesPercentage((n + 1) / this.#resourcesMap.size),
        )
        n++
        return res
      })
      promises.push(promise)
    }
    Promise.all(promises)
      .then(() => {
        store.dispatch(setHasLoadedResources(true))
      })
      .catch((error) => console.error(error))
  }
}
