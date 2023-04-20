import './App.css'
import '@glideapps/glide-data-grid/dist/index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { LoginProvider } from './user/components/provider'
import { Col, Container, Nav, Navbar, Row } from 'react-bootstrap'
import { RemoteDataTable } from './table/components'
import { UserContext } from './user/hooks'
import { NavLink, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'

export function VranRoot() {
    return (
        <Row className="flex-grow-1 m-0">
            <Col className="ps-0 pe-0">
                <div className="vran-page-container">
                    <Navbar expand="lg" className="vran-nav-bar">
                        <Container>
                            <Navbar.Brand href="#home">VrAN</Navbar.Brand>
                            <Navbar.Toggle aria-controls="basic-navbar-nav" />
                            <Navbar.Collapse id="basic-navbar-nav">
                                <Nav className="me-auto">
                                    <Nav.Link as={NavLink} to="/">
                                        View
                                    </Nav.Link>
                                    <Nav.Link as={NavLink} to="/upload">
                                        Upload
                                    </Nav.Link>
                                </Nav>
                            </Navbar.Collapse>
                        </Container>{' '}
                    </Navbar>
                    <div className="vran-page-body">
                        <Outlet />
                    </div>
                </div>
            </Col>
        </Row>
    )
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <VranRoot />,
        children: [
            { path: '', element: <TableConnector />, index: true },
            { path: 'upload', element: <p>UPLOAD</p> }
        ]
    }
])

function App() {
    return (
        <Container
            fluid
            className=" min-vh-100 d-flex flex-column ps-0 pe-0 ms-0 me-0 vran-container"
        >
            <LoginProvider body={<RouterProvider router={router} />} />
        </Container>
    )
}
export default App
function TableConnector() {
    return (
        <UserContext.Consumer>
            {(userInfoWithLogout) =>
                userInfoWithLogout && (
                    <RemoteDataTable
                        column_defs={userInfoWithLogout.userInfo.columns}
                    />
                )
            }
        </UserContext.Consumer>
    )
}
