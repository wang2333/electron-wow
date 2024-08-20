type ColorArray = [number, number, string]
interface IColorDict {
  playerAttack: ColorArray
  hasMonster: ColorArray
  monsteAttack: ColorArray
}

/** 每毫秒旋转角度 */
export const DEGREES_PER_MILLISEOND = 1980 / 360

/** 右键每像素旋转角度 */
export const DEGREES_PER_PIXEL = 1600 / 360

/** 人物中心点 */
export const PERSON_CENTER = {
  x: 850,
  y: 800
}
/** 游戏画面中心点 */
export const GAME_POSITION = {
  x: 980,
  y: 130
}
/** 雷达箭头模板路径 */
export const ARROW_IMG_PATH = window.api.getResourcePath('resources/images/arrow.png')

/** 怪物血条模板路径 */
export const BLOOD_IMG_PATH = window.api.getResourcePath('resources/images/blood.png')

/** 事件对应的坐标和色值 */
export const COLOR_DICT: IColorDict = {
  hasMonster: [1350, 1050, '#80df27'],
  monsteAttack: [1221, 1074, '#ca0000'],
  playerAttack: [345, 1084, '#ffe66c']
}
