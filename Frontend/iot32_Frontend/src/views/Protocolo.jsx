import React, { useState } from 'react'
import { CContainer, CNav, CNavItem, CNavLink, CTabContent, CTabPane } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloud, cilGlobeAlt } from '@coreui/icons'
import useCloud from '../hook/useCloud'

// Sub-components
import MqttTab from './Protocolo/MqttTab'

const Protocolo = () => {
    const cloudProps = useCloud()
    const [activeTab, setActiveTab] = useState(1)

    return (
        <CContainer fluid className="px-4">
            <h4 className="mb-4">Configuración de Protocolo Cloud</h4>

            <CNav variant="tabs" className="mb-4">
                <CNavItem>
                    <CNavLink active={activeTab === 1} onClick={() => setActiveTab(1)} style={{ cursor: 'pointer' }}>
                        <CIcon icon={cilCloud} className="me-2" />
                        MQTT
                    </CNavLink>
                </CNavItem>
            </CNav>

            <CTabContent>
                {/* TAB MQTT */}
                <CTabPane visible={activeTab === 1}>
                    <MqttTab {...cloudProps} />
                </CTabPane>
            </CTabContent>
        </CContainer>
    )
}

export default Protocolo
