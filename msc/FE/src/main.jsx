import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Routing from './routes/Routing'
import A11yToolbar from './components/A11yToolbar'
import PoliceIAWidget from './components/PoliceIAWidget'
import './styles/Variables.css'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <A11yToolbar />
    <PoliceIAWidget />
    <Routing/>
  </StrictMode>,
)
