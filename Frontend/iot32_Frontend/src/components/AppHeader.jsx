import React from 'react'
import { NavLink } from 'react-router-dom'
import {
    CHeader, CHeaderToggler, CHeaderNav, CHeaderBrand, CContainer,
    CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CDropdownDivider
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMenu, cilList, cilUser, cilChevronBottom, cilSettings, cilAccountLogout } from '@coreui/icons'
import Swal from 'sweetalert2'
import useApp from '../hook/useApp'
import ThemeSwitcher from './ThemeSwitcher'

import logo from '../assets/Logo.jpeg'

const AppHeader = ({ sidebarShow, setSidebarShow }) => {
    const { deleteSession } = useApp()

    const showAlertConfirm = (title, text, icon, funct) => {
        Swal.fire({
            title, text, icon,
            showCancelButton: true,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed && funct === 'logout') deleteSession()
        })
    }

    return (
        <CHeader position="sticky" className="mb-0 p-0 shadow-sm border-0" style={{ background: 'rgba(13, 17, 23, 0.8)', backdropFilter: 'blur(10px)' }}>
            <CContainer fluid className="px-4 py-2 border-bottom" style={{ borderColor: 'rgba(0, 242, 255, 0.1)' }}>
                <CHeaderToggler
                    onClick={() => setSidebarShow(v => !v)}
                    className="ps-1"
                    style={{
                        backgroundColor: 'rgba(0, 242, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 242, 255, 0.2)'
                    }}
                >
                    <CIcon icon={cilMenu} size="lg" style={{ color: 'var(--neon-primary)' }} />
                </CHeaderToggler>
                <CHeaderBrand className="mx-auto d-md-none d-flex justify-content-center">
                    <span style={{ color: 'var(--neon-primary)', fontWeight: '800', letterSpacing: '1px' }}>IOT_HUB</span>
                </CHeaderBrand>
                <CHeaderNav className="ms-auto align-items-center gap-3">
                    <ThemeSwitcher />
                    <CDropdown variant="nav-item" placement="bottom-end">
                        <CDropdownToggle caret={false} className="d-flex align-items-center py-0" style={{ border: 'none' }}>
                            <div style={{ padding: '6px', borderRadius: '50%', background: 'rgba(0, 242, 255, 0.1)', border: '1px solid rgba(0, 242, 255, 0.2)' }}>
                                <CIcon icon={cilUser} style={{ color: 'var(--neon-primary)' }} />
                            </div>
                        </CDropdownToggle>
                        <CDropdownMenu className="bg-dark border-secondary">
                            <div className="text-center p-2 fw-semibold uppercase-mini" style={{ color: 'var(--neon-primary)', fontSize: '0.8rem', letterSpacing: '1px' }}>SYSTEM_OPTS</div>
                            <CDropdownDivider style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            <CDropdownItem as={NavLink} to="/settings" className="text-light neon-hover">
                                <CIcon icon={cilSettings} className="me-2" /> Configurar
                            </CDropdownItem>
                            <CDropdownDivider style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            <CDropdownItem
                                style={{ cursor: 'pointer' }}
                                className="text-danger neon-hover-danger"
                                onClick={() => showAlertConfirm('Sesión', '¿Está seguro de cerrar la sesión?', 'question', 'logout')}
                            >
                                <CIcon icon={cilAccountLogout} className="me-2" /> Salir
                            </CDropdownItem>
                        </CDropdownMenu>
                    </CDropdown>
                </CHeaderNav>
            </CContainer>
        </CHeader>
    )
}

export default AppHeader
