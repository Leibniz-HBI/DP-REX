import './App.css'
import { PersonTable } from './person_natural/components'
import '@glideapps/glide-data-grid/dist/index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { LoginProvider } from './user/components/provider'
import { VranConf } from './config'
import { HeaderProps } from './user/hooks'
import { Button, Col, Container, Row } from 'react-bootstrap'

function VranHeader({ headerProps }: { headerProps: HeaderProps }) {
    return (
        <Row className="vran-header justify-content-between ms-0 me-0 ">
            <Col></Col>
            <Col md="auto">VrAN</Col>
            <Col>
                {headerProps.logoutCallback && (
                    <Button variant="link" onClick={headerProps.logoutCallback}>
                        Logout
                    </Button>
                )}
            </Col>
        </Row>
    )
}

function App() {
    return (
        <Container
            fluid
            className=" min-vh-100 d-flex flex-column ps-0 pe-0 vran-container"
        >
            <LoginProvider
                apiPath={VranConf.get().api_base}
                header={(headerProps) => <VranHeader headerProps={headerProps} />}
                body={() => <PersonTable />}
            />
        </Container>
    )
}

export default App
