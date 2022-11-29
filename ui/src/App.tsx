import './App.css'
import { PersonTable } from './person_natural/components'
import '@glideapps/glide-data-grid/dist/index.css'

function App() {
    return (
        <div className="vran-container">
            <div className="vran-header">VrAN</div>
            <div className="vran-body">
                <PersonTable />
            </div>
        </div>
    )
}

export default App
