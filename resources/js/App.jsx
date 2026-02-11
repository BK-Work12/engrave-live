import { useState } from 'react'
import NavBar from '../src/components/NavBar.jsx'
import './App.css'
import Home from "./pages/Home.jsx"
import Hero from './components/Hero.jsx';
import Goal from './components/Goal.jsx';
import Steps from './components/Steps.jsx';
import Styles from './components/Styles.jsx';
import FindAnswers from './components/FindAnswers.jsx';
import PromotionBox from './components/PromotionBox.jsx';
import Footer from './components/Footer.jsx';
import Create from './pages/Create.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import FAQ from './pages/FAQ.jsx';
import Pricing from './pages/Pricing.jsx';
import StyleExamples from './pages/StyleExamples.jsx';
import AIDesignGenerator from './pages/AIDesignGenerator.jsx';
import Login from './pages/Login.jsx';
import SignUp from './pages/SignUp.jsx';
import Verify from './pages/Verify.jsx';
import Forget from './pages/Forget.jsx';
import UpdatePassword from './pages/UpdatePassword.jsx';
import SeamlessPatternStyling from './components/SeamlessPatternStyling.jsx';
import SeamlessPatternCreator from './pages/SeamlessPatternCreator.jsx';
import SVGTracingTool from './pages/SVGTracingTool.jsx';
import AppRoutes from './routes/Routes.jsx';
function App() {
  const [count, setCount] = useState(0)
  return (
    <>
      <AppRoutes/>
    </>
  );
}

export default App
