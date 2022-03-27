import { FunctionComponent } from 'preact'
import { useState } from 'preact/hooks'
import { FormattedMessage } from 'react-intl'
import { useDispatch, useSelector } from 'react-redux'
import { openDialog } from '../reducers/dialogs'
import { addFile, addOpenError, clearOpenError, closeAllFiles, getFiles, setLoading } from '../reducers/files'
import { getSprite, setSprite } from '../reducers/sprite'
import { BufferReader } from '../utils/buffer'
import { SFSprite, SFSpriteReadError, writeSpriteToBuffer } from '../utils/sfsprite'
import styles from './file-side-page.module.css'

export const FileSidePage: FunctionComponent = props => {
  const dispatch = useDispatch()
  const sprite = useSelector(getSprite)
  const files = useSelector(getFiles)
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
    if (files.length > 0) {
      dispatch(openDialog('loading'))
      if (files.length === 1) {
        const file = files[0] // TODO: Load more files
        if (file && file.kind === 'file') {
          dispatch(clearOpenError())
          dispatch(setLoading(true))
          const f = await file.getFile()
          const buffer = await f.arrayBuffer()
          const br = new BufferReader(buffer)
          const sprite = new SFSprite()
          try {
            sprite.loadFromFileBuffer(br)
            dispatch(addFile(file.name, sprite))
            dispatch(setSprite(sprite))
          } catch (err) {
            if (err instanceof SFSpriteReadError) {
              dispatch(addOpenError(file.name, err))
            }
          }
          dispatch(setLoading(false))
        }
      } else {
        dispatch(clearOpenError())
        dispatch(setLoading(true))
        const promises = files.map(async (file) => {
          if (file && file.kind === 'file') {
            const f = await file.getFile()
            const buffer = await f.arrayBuffer()
            const br = new BufferReader(buffer)
            const sprite = new SFSprite()
            try {
              sprite.loadFromFileBuffer(br)
              dispatch(addFile(file.name, sprite))
            } catch (err) {
              if (err instanceof SFSpriteReadError) {
                dispatch(addOpenError(file.name, err))
              }
            }
          }
        })
        await Promise.all(promises)
        dispatch(setLoading(false))
      }
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
  return <div className={styles.filePage}>
    <div className={styles.fileButtons}>
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
      <button onClick={evt => {
        dispatch(closeAllFiles())
        onNewFileClicked(evt)
      }}>
        <FormattedMessage
          id='file.closeall'
          description='A button that close all files'
          defaultMessage='Close all files'
        />
      </button>
    </div>
    <div className={styles.fileList}>
      {
        files.map(file => <button onClick={() => dispatch(setSprite(file.data))}>
          {file.filename}
        </button>)
      }
    </div>
  </div>
}
