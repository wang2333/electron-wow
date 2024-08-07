import { grabRegion, loadImage, saveImage } from './Control'

function App(): JSX.Element {
  const getWindows = async () => {
    const res = await window.api.activeWindow()
    console.log('👻 ~ res:', res)
  }
  const save = async () => {
    const imageData = await grabRegion(222, 222, 500, 500)
    await saveImage('/123123.png', imageData)
  }

  const load = async () => {
    loadImage('/123123.png', (_, src) => {
      const ele = document.getElementById('image') as HTMLImageElement
      if (ele) {
        ele.src = src
      }
    })
  }
  return (
    <>
      <h1 onClick={getWindows}>Image Viewer</h1>
      <button onClick={save}>Save Image</button>
      <button onClick={load}>Load Image</button>
      <img id="image" alt="Image will appear here" />
    </>
  )
}

export default App
