import { useState } from 'react'
import NavBar from '../components/NavBar.jsx';
import "../App.css";
import Hero from '../components/Hero.jsx';
import Goal from '../components/Goal.jsx';
import Steps from '../components/Steps.jsx';
import Styles from '../components/Styles.jsx';
import FindAnswers from '../components/FindAnswers.jsx';

import Footer from '../components/Footer.jsx';

function Home() {
  const [count, setCount] = useState(0)
  return (
    <>

      <Hero />
      <Goal />
      <Steps />
      <Styles />
      <FindAnswers />

    </>
  );
}

export default Home
