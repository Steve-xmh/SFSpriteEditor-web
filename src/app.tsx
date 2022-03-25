import styles from './app.module.css'
import { useCallback } from 'preact/hooks'
import { SidebarButton } from './components/sidebar-button'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentTab, setTab } from './reducers/tab'
import { SpriteList } from './components/sprites-list'
import { PaletteList } from './components/palettes'
import { FileSidePage } from './components/file-side-page'
import { DebugPage } from './components/debug-page'
import { switchPreviewPalette } from './reducers/editing'
import { EditPage } from './components/edit-page'
import { AboutPage } from './components/about-page'
import { AnimationsPage } from './components/animations-page'
import { SwitchPalettesDialog } from './components/switch-palettes-dialog'
import fileSvg from './assets/file.svg'
import editSvg from './assets/edit.svg'
import palettesSvg from './assets/palettes.svg'
import tilesSvg from './assets/tiles.svg'
import spritesSvg from './assets/sprites.svg'
import animationsSvg from './assets/animations.svg'
import optionsSvg from './assets/options.svg'
import aboutSvg from './assets/about.svg'
import { EditorCanvas } from './components/editor-canvas'
import { OptionsPage } from './components/options-page'
import { useIntl } from 'react-intl'

export function App() {
  const dispatch = useDispatch()
  const intl = useIntl()
  const currentTab = useSelector(getCurrentTab)
  function toggleTab(name: string) {
    return useCallback(
      () => dispatch(setTab(name)),
      [dispatch]
    )
  }
  return (
    <div className={styles.app}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <SidebarButton title={intl.formatMessage({
          id: 'tab.file',
          defaultMessage: 'File',
        })} onClick={toggleTab('file')}>
          <img src={fileSvg}></img>
        </SidebarButton>
        <SidebarButton title={intl.formatMessage({
          id: 'tab.edit',
          defaultMessage: 'Edit',
        })} onClick={toggleTab('edit')}>
          <img src={editSvg}></img>
        </SidebarButton>
        <SidebarButton title={intl.formatMessage({
          id: 'tab.palettes',
          defaultMessage: 'Palettes',
        })} onClick={toggleTab('tiles')}>
          <img src={tilesSvg}></img>
        </SidebarButton>
        <SidebarButton title={intl.formatMessage({
          id: 'tab.animations',
          defaultMessage: 'Animations',
        })} onClick={toggleTab('palettes')}>
          <img src={palettesSvg}></img>
        </SidebarButton>
        <SidebarButton title={intl.formatMessage({
          id: 'tab.options',
          defaultMessage: 'Options',
        })} onClick={toggleTab('sprites')}>
          <img src={spritesSvg}></img>
        </SidebarButton>
        <SidebarButton title={intl.formatMessage({
          id: 'tab.animations',
          defaultMessage: 'Animations',
        })} onClick={toggleTab('animations')}>
          <img src={animationsSvg}></img>
        </SidebarButton>
        <SidebarButton title={intl.formatMessage({
          id: 'tab.options',
          defaultMessage: 'Options',
        })} onClick={toggleTab('options')}>
          <img src={optionsSvg}></img>
        </SidebarButton>
        <SidebarButton title={intl.formatMessage({
          id: 'tab.about',
          defaultMessage: 'About',
        })} onClick={toggleTab('about')}>
          <img src={aboutSvg}></img>
        </SidebarButton>
      </div>
      <div className={styles.tabpage} style={{ display: currentTab ? 'block' : 'none' }}>
        {currentTab === 'file' && <FileSidePage />}
        {currentTab === 'palettes' && <PaletteList />}
        {currentTab === 'animations' && <AnimationsPage />}
        {currentTab === 'edit' && <EditPage />}
        {currentTab === 'options' && <OptionsPage />}
        {currentTab === 'about' && <AboutPage />}
        <SpriteList display={currentTab === 'sprites' ? 'block' : 'none'} />
      </div>
      <EditorCanvas />
      <SwitchPalettesDialog dialogId='switchPreviewPalette' onSelectedPalette={id => dispatch(switchPreviewPalette(id))} />
    </div>
  )
}
