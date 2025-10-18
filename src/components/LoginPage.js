import React from "react";
// import "./LoginPage.css";

const LoginPage = () => {
  return (
    <div className="login-container">
      <h1>LOGIN PORTAL</h1>
      <form className="login-form">
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <button>Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
