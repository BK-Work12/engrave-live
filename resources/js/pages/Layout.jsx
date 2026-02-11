import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function Layout({ children }) {
  return (
    <>
      <NavBar />
      {children}
      <Footer />
    </>
  );
}
