import { useRef, useEffect, useState } from 'react'

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="8.2" r="1" fill="currentColor" />
      <path d="M12 11.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 21V9l8-6 8 6v12" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 21v-7h6v7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function MusicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 10h8M8 14h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ArtistIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19.4 12a7.4 7.4 0 0 0-.1-1l2-1.5-2-3.5-2.4.9a7.4 7.4 0 0 0-1.7-1L12.6 2h-1.2l-.2 2.4a7.4 7.4 0 0 0-1.7 1l-2.4-.9-2 3.5 2 1.5a7.4 7.4 0 0 0 1.7 1l.2 2.4h1.2l.2-2.4a7.4 7.4 0 0 0 1.7-1l2.4.9 2-3.5-2-1.5a7.4 7.4 0 0 0 .1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

const ICON_MAP = {
  overview: DashboardIcon,
  units: BuildingIcon,
  performance: MusicIcon,
  copy: CopyIcon,
  revenue: MoneyIcon,
  artists: ArtistIcon,
  admin: SettingsIcon,
}

function TabScroller({ _children, _scrollRef, direction }) {
  const containerRef = useRef(null)
  const [canScroll, setCanScroll] = useState(false)

  useEffect(() => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
      if (direction === 'left') {
        setCanScroll(scrollLeft > 0)
      } else {
        setCanScroll(scrollLeft + clientWidth < scrollWidth - 1)
      }
    }
  }, [direction])

  const handleClick = () => {
    if (containerRef.current) {
      const scrollAmount = 200
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (!canScroll) return null

  return (
    <button
      type="button"
      className={`tab-scroller tab-scroller-${direction}`}
      onClick={handleClick}
      aria-label={direction === 'left' ? 'Cuộn trái' : 'Cuộn phải'}
      tabIndex={-1}
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  )
}

function TabItem({ tab, isActive, onClick, onClose, onContextMenu, tabsCount }) {
  const Icon = ICON_MAP[tab.key] || DashboardIcon
  const label = tab.detailId ? `${tab.label}: ${tab.detailName}` : tab.label
  const showClose = tabsCount > 1

  return (
    <div
      className={`workspace-tab${isActive ? ' active' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onClick(tab.id)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(e, tab)
      }}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(tab.id)
        }
      }}
    >
      <span className="tab-icon" aria-hidden="true"><Icon /></span>
      <span className="tab-label" title={label}>{label}</span>
      {showClose && (
        <button
          type="button"
          className="tab-close"
          onClick={(e) => {
            e.stopPropagation()
            onClose(tab.id)
          }}
          aria-label={`Đóng tab ${label}`}
          tabIndex={-1}
        >
          ×
        </button>
      )}
    </div>
  )
}

function ContextMenu({ menu, onClose, anchorRef }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    if (anchorRef.current && menuRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      menuRef.current.style.top = `${rect.bottom + 4}px`
      menuRef.current.style.left = `${rect.left}px`
    }
  }, [anchorRef])

  if (!menu) return null

  return (
    <div className="tab-context-menu" ref={menuRef} role="menu">
      {menu.items.map((item, idx) => (
        <button
          key={idx}
          type="button"
          className={`tab-context-menu-item${item.danger ? ' danger' : ''}`}
          onClick={() => {
            item.onClick()
            onClose()
          }}
          role="menuitem"
          tabIndex={-1}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default function WorkspaceTabs({
  tabs,
  activeTabId,
  onActivateTab,
  onCloseTab,
  onCloseOthers,
  onCloseAll,
}) {
  const tabsContainerRef = useRef(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [contextAnchor, setContextAnchor] = useState(null)
  const [scrollLeft, setScrollLeft] = useState(false)
  const [scrollRight, setScrollRight] = useState(false)

  const scrollToActive = () => {
    if (tabsContainerRef.current) {
      const activeTab = tabsContainerRef.current.querySelector('.workspace-tab.active')
      if (activeTab) {
        const container = tabsContainerRef.current
        const tabLeft = activeTab.offsetLeft
        const tabRight = tabLeft + activeTab.offsetWidth
        const scrollLeft = container.scrollLeft
        const clientWidth = container.clientWidth

        if (tabLeft < scrollLeft) {
          container.scrollTo({ left: tabLeft, behavior: 'smooth' })
        } else if (tabRight > scrollLeft + clientWidth) {
          container.scrollTo({ left: tabRight - clientWidth, behavior: 'smooth' })
        }
      }
    }
  }

  useEffect(() => {
    scrollToActive()
  }, [activeTabId])

  const checkOverflow = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current
      setScrollLeft(scrollLeft > 0)
      setScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }
  }

  useEffect(() => {
    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [tabs.length])

  const handleContextMenu = (e, tab) => {
    setContextAnchor({ x: e.clientX, y: e.clientY })
    setContextMenu({
      tab,
      items: [
        { label: 'Đóng tab này', onClick: () => onCloseTab(tab.id) },
        { label: 'Đóng các tab khác', onClick: () => onCloseOthers(tab.id) },
        { label: 'Đóng tất cả', onClick: onCloseAll, danger: true },
      ],
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
    setContextAnchor(null)
  }

  return (
    <div className="workspace-tabs-bar">
      <TabScroller
        scrollRef={tabsContainerRef}
        direction="left"
        style={{ display: scrollLeft ? 'flex' : 'none' }}
      />
      <div className="workspace-tabs-container" ref={tabsContainerRef} role="tablist">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onClick={onActivateTab}
            onClose={onCloseTab}
            onContextMenu={handleContextMenu}
            tabsCount={tabs.length}
          />
        ))}
      </div>
      <TabScroller
        scrollRef={tabsContainerRef}
        direction="right"
        style={{ display: scrollRight ? 'flex' : 'none' }}
      />
      <ContextMenu
        menu={contextMenu}
        onClose={closeContextMenu}
        anchorRef={{ current: contextAnchor }}
      />
    </div>
  )
}