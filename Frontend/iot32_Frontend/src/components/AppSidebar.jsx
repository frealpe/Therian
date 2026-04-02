import React from 'react'
import { NavLink } from 'react-router-dom'
import {
    CSidebar, CSidebarBrand, CSidebarToggler, CSidebarHeader
} from '@coreui/react'
import Swal from 'sweetalert2'
import useApp from '../hook/useApp'
import navigation from '../_nav'
import { AppSidebarNav } from './AppSidebarNav'

import CIcon from '@coreui/icons-react'
import { cilSatelite } from '@coreui/icons'

const AppSidebar = ({ sidebarShow, setSidebarShow }) => {
    const { deleteSession } = useApp()

    const showAlertConfirm = (title, text, icon, funct) => {
        Swal.fire({
            title, text, icon,
            showCancelButton: true,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                if (funct === 'restart') console.log('Comando restart no soportado sin websockets')
                else deleteSession()
            }
        })
    }

    return (
        <CSidebar
            className="border-end"
            colorScheme="dark"
            position="fixed"
            visible={sidebarShow}
            onVisibleChange={(visible) => setSidebarShow(visible)}
            overlaid={window.innerWidth < 768}
            style={{
                backgroundColor: '#0d1117',
                borderRight: '1px solid var(--glass-border) !important'
            }}
        >
            <CSidebarHeader className="border-bottom" style={{ borderColor: 'rgba(0, 242, 255, 0.1)' }}>
                <CSidebarBrand className="d-none d-md-flex justify-content-center w-100">
                    <div className="d-flex align-items-center">
                        <CIcon icon={cilSatelite} size="xl" className="text-info me-2" />
                        <span style={{ color: 'var(--neon-primary)', fontWeight: '800', letterSpacing: '2px' }}>IOT_HUB</span>
                    </div>
                </CSidebarBrand>
            </CSidebarHeader>
            <AppSidebarNav
                items={navigation}
                onActionClick={(action) => {
                    if (action === 'restart') {
                        showAlertConfirm('Reiniciar', '¿Está seguro de reiniciar el dispositivo?', 'question', 'restart')
                    } else if (action === 'logout') {
                        showAlertConfirm('Sesión', '¿Está seguro de cerrar la sesión?', 'question', 'logout')
                    }
                }}
            />
            <CSidebarToggler onClick={() => setSidebarShow(v => !v)} />
        </CSidebar>
    )
}

export default AppSidebar
