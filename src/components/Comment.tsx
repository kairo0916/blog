import * as React from 'react'
import Giscus from '@giscus/react'

const id = 'inject-comments'

function getSavedTheme() {
  return window.localStorage.getItem('theme')
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const Comments = () => {
  const [mounted, setMounted] = React.useState(false)
  const [theme, setTheme] = React.useState('light')

  React.useEffect(() => {
    const theme = getSavedTheme() || getSystemTheme()
    setTheme(theme)
  
    const observer = new MutationObserver(() => {
      setTheme(getSavedTheme())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

      return () => {
      observer.disconnect()
    }
  }, [])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div id={id} className="w-full">
      {mounted ? (
        <Giscus
          id={id}
                data-repo="kairo0916/blog"
                data-repo-id="R_kgDOQtO5Rw"
                data-category="Announcements"
                data-category-id="DIC_kwDOQtO5R84C0KvZ"
                data-mapping="pathname"
                data-strict="0"
                data-reactions-enabled="1"
                data-emit-metadata="0"
                data-input-position="top"
                data-theme="preferred_color_scheme"
                data-lang="zh-TW"
                data-loading="lazy"
                crossorigin="anonymous"
        />
      ) : null}
    </div>
  )
}

export default Comments
