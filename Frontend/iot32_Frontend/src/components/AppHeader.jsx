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
        <CHeader position="sticky" className="mb-4 p-0">
            <CContainer fluid className="border-bottom px-4">
                <CHeaderToggler
                    onClick={() => setSidebarShow(v => !v)}
                    className="ps-1"
                    style={{
                        marginInlineStart: '-14px',
                        backgroundColor: !sidebarShow ? 'rgba(50, 31, 219, 0.1)' : 'transparent',
                        borderRadius: '4px',
                        padding: '5px'
                    }}
                >
                    <CIcon icon={sidebarShow ? cilMenu : cilList} size="lg" className="text-primary" />
                </CHeaderToggler>
                <CHeaderBrand className="mx-auto d-md-none d-flex justify-content-center">
                    <img src={logo} alt="Logo" height={30} />
                </CHeaderBrand>
                <CHeaderNav className="ms-auto">
                    <CDropdown variant="nav-item" placement="bottom-end">
                        <CDropdownToggle caret={false} className="d-flex align-items-center">
                            <CIcon icon={cilUser} className="d-sm-none" />
                            <span className="d-none d-sm-inline-block">Usuario</span>
                            <CIcon icon={cilChevronBottom} size="sm" className="ms-1 d-none d-sm-inline-block" />
                        </CDropdownToggle>
                        <CDropdownMenu>
                            <div className="bg-primary rounded-top text-white text-center p-2 fw-semibold">Opciones</div>
                            <CDropdownItem as={NavLink} to="/settings">
                                <CIcon icon={cilSettings} className="me-2" /> Configurar
                            </CDropdownItem>
                            <CDropdownDivider />
                            <CDropdownItem
                                style={{ cursor: 'pointer' }}
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
