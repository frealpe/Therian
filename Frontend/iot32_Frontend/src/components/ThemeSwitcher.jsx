import React, { useEffect, useState } from 'react'
import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBrush } from '@coreui/icons'

const ThemeSwitcher = () => {
    const [color, setColor] = useState(localStorage.getItem('theme-color') || '#00f2ff')

    const themes = [
        { name: 'NEON_CYAN', color: '#00f2ff' },
        { name: 'NEON_MAGENTA', color: '#ff0066' },
        { name: 'NEON_GREEN', color: '#39ff14' },
        { name: 'NEON_GOLD', color: '#ffcc00' }
    ]

    useEffect(() => {
        document.documentElement.style.setProperty('--neon-primary', color)
        localStorage.setItem('theme-color', color)
    }, [color])

    return (
        <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false} className="d-flex align-items-center py-0" style={{ border: 'none' }}>
                <div
                    title="Change Theme"
                    style={{
                        padding: '6px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid currentColor',
                        color: color,
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                >
                    <CIcon icon={cilBrush} />
                </div>
            </CDropdownToggle>
            <CDropdownMenu className="bg-dark border-secondary shadow-lg">
                <div className="text-center p-2 fw-semibold uppercase-mini" style={{ color: color, fontSize: '0.7rem' }}>COLOR_SCHEME</div>
                {themes.map((t) => (
                    <CDropdownItem
                        key={t.name}
                        onClick={() => setColor(t.color)}
                        style={{ cursor: 'pointer', color: t.color }}
                        className="neon-hover"
                    >
                        <span className="monospace small" style={{ fontSize: '0.75rem' }}>{t.name}</span>
                    </CDropdownItem>
                ))}
            </CDropdownMenu>
        </CDropdown>
    )
}

export default ThemeSwitcher
