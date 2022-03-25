import { FunctionComponent } from 'preact'
import { useState } from 'preact/hooks'
import { FormattedMessage } from 'react-intl'
import { useDispatch, useSelector } from 'react-redux'
import { getSprite, setSprite } from '../reducers/sprite'
import { BufferReader } from '../utils/buffer'
import { SFSprite, writeSpriteToBuffer } from '../utils/sfsprite'
import styles from './file-side-page.module.css'

export const FileSidePage: FunctionComponent = props => {
  const dispatch = useDispatch()
  const sprite = useSelector(getSprite)
  const [lastSaved, setLastSaved] = useState(null)
  const onOpenFileButtonClicked = async (evt: React.MouseEvent) => {
    evt.preventDefault()
    const files: FileSystemFileHandle[] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'MMSF Sprite',
          accept: {
            'application/octet-stream': ['.bin', '.sfsprite']
          }
        },
      ],
      excludeAcceptAllOption: true,
      multiple: true
    })
    console.log('onOpenFileButtonClicked', files)
    const file = files[0] // TODO: Load more files
    if (file && file.kind === 'file') {
      const f = await file.getFile()
      const buffer = await f.arrayBuffer()
      console.log('buffer', buffer)
      const br = new BufferReader(buffer)
      const sprite = new SFSprite()
      sprite.loadFromFileBuffer(br)
      console.log(sprite)
      dispatch(setSprite(sprite))
    }
  }
  const onSaveFileButtonClicked = async (evt: React.MouseEvent, saveAs = false) => {
    evt.preventDefault()
    if ('showSaveFilePicker' in (window as any)) {
      if (saveAs || !lastSaved) {
        const file: FileSystemFileHandle = await (window as any).showSaveFilePicker({
          types: [
            {
              description: 'MMSF Sprite',
              accept: {
                'application/octet-stream': ['.bin', '.sfsprite']
              }
            },
          ],
          excludeAcceptAllOption: true
        })
        if (file) {
          const writable = await (file as any).createWritable()
          const outputData = writeSpriteToBuffer(sprite)
          await writable.write(outputData)
          await writable.close()
          setLastSaved(file)
        }
      } else {
        const file = lastSaved
        if (file) {
          const writable = await (file as any).createWritable()
          const outputData = writeSpriteToBuffer(sprite)
          await writable.write(outputData)
          await writable.close()
          setLastSaved(file)
        }
      }
    } else {
      const a = document.createElement('a')
      const outputData = writeSpriteToBuffer(sprite)
      const url = URL.createObjectURL(new Blob([outputData], {
        type: 'application/octet-stream'
      }))
      a.href = url
      a.setAttribute('download', 'sprite.bin')
      a.click()
      URL.revokeObjectURL(url)
    }
  }
  const onNewFileClicked = (evt: React.MouseEvent) => {
    evt.preventDefault()
    dispatch(setSprite({
      colorMode: false,
      animations: [],
      tilesets: [],
      palettes: [],
      sprites: []
    }))
  }
  return <div className={styles.fileButtons}>
    <button onClick={onNewFileClicked}>
      <FormattedMessage
        id='file.new'
        description='A button that creates new empty SFSprite file'
        defaultMessage='New File'
      />
    </button>
    <button onClick={onOpenFileButtonClicked}>
      <FormattedMessage
        id="file.open"
        description='A button that open SFSprite file'
        defaultMessage='Open File(s)...'
      />
    </button>
    <button onClick={evt => onSaveFileButtonClicked(evt)}>
      <FormattedMessage
        id='file.save'
        description='A button that save SFSprite file'
        defaultMessage='Save File...'
      />
    </button>
    <button onClick={evt => onSaveFileButtonClicked(evt, true)}>
      <FormattedMessage
        id='file.saveas'
        description='A button that save SFSprite into another file'
        defaultMessage='Save File as...'
      />
    </button>
  </div>
}
