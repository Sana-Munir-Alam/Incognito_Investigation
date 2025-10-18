import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";

function App() {
  const [showLanding, setShowLanding] = useState(true);

  return (
    <>
      {showLanding ? (
        <LandingPage onFinish={() => setShowLanding(false)} />
      ) : (
        <LoginPage />
      )}
    </>
  );
}

export default App;