import UserLayout from "@/layout/UserLayout";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./style.module.css";
import { loginUser, registerUser } from "@/config/redux/action/authAction";
import { emptyMessage } from "@/config/redux/reducer/authReducer";

function LoginComponent() {
  const authState = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();

  const [userLoginMethod, setUserLoginMethod] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (authState.loggedIn) {
      router.push("/dashboard");
    }
  }, [authState.loggedIn]);

  useEffect(() => {
    dispatch(emptyMessage());
  }, [userLoginMethod]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.push("/dashboard");
    }
  });

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) errs.email = "Email is required";
    else if (!emailRegex.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Min 6 characters";
    if (!userLoginMethod) {
      if (!username) errs.username = "Username required";
      if (!name) errs.name = "Name required";
    }
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;
    dispatch(registerUser({ username, password, email, name }));
  };

  const handleLogin = () => {
    if (!validate()) return;
    dispatch(loginUser({ email, password }));
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID_HERE") {
      alert("Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local");
      return;
    }
    const redirectUri = encodeURIComponent("http://localhost:3000/auth/google/callback");
    const scope = encodeURIComponent("openid email profile");
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}` +
      `&redirect_uri=${redirectUri}&response_type=code&scope=${scope}` +
      `&access_type=offline&prompt=consent`;
    window.location.href = url;
  };

  const statusMessage =
    typeof authState.message === "string"
      ? authState.message
      : authState.message?.message;

  return (
    <UserLayout>
      <div className={styles.container}>
        <div className={styles.surfaceLayer} />
        <div className={styles.cardContainer}>
          <div className={styles.leftPanel}>
            <h1 className={styles.brandTitle}>
              <span>Pro</span>Connect
            </h1>
            <p className={styles.mutedTag}>
              Where authentic connections begin.
            </p>
          </div>
          <div className={styles.formPanel}>
            <div className={styles.modeToggle}>
              <button
                className={userLoginMethod ? styles.modeInactive : styles.modeActive}
                onClick={() => setUserLoginMethod(false)}
                type="button"
              >
                Sign Up
              </button>
              <button
                className={userLoginMethod ? styles.modeActive : styles.modeInactive}
                onClick={() => setUserLoginMethod(true)}
                type="button"
              >
                Sign In
              </button>
            </div>

            {statusMessage && (
              <div
                className={authState.isError ? styles.feedbackError : styles.feedbackSuccess}
                role="status"
              >
                {statusMessage}
              </div>
            )}

            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (userLoginMethod) handleLogin();
                else handleRegister();
              }}
              className={styles.form}
            >
              {!userLoginMethod && (
                <div className={styles.dualFields}>
                  <div className={styles.fieldWrapper}>
                    <label htmlFor="username" className={styles.fieldLabel}>Username</label>
                    <input
                      id="username" value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onBlur={() => { setTouched((t) => ({ ...t, username: true })); validate(); }}
                      className={localErrors.username && touched.username ? `${styles.inputField} ${styles.inputInvalid}` : styles.inputField}
                      type="text" placeholder="Choose a username" autoComplete="username"
                    />
                    {localErrors.username && touched.username && <p className={styles.fieldError}>{localErrors.username}</p>}
                  </div>
                  <div className={styles.fieldWrapper}>
                    <label htmlFor="name" className={styles.fieldLabel}>Name</label>
                    <input
                      id="name" value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => { setTouched((t) => ({ ...t, name: true })); validate(); }}
                      className={localErrors.name && touched.name ? `${styles.inputField} ${styles.inputInvalid}` : styles.inputField}
                      type="text" placeholder="Your full name" autoComplete="name"
                    />
                    {localErrors.name && touched.name && <p className={styles.fieldError}>{localErrors.name}</p>}
                  </div>
                </div>
              )}

              <div className={styles.fieldWrapper}>
                <label htmlFor="email" className={styles.fieldLabel}>Email</label>
                <input
                  id="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => { setTouched((t) => ({ ...t, email: true })); validate(); }}
                  className={localErrors.email && touched.email ? `${styles.inputField} ${styles.inputInvalid}` : styles.inputField}
                  type="email" placeholder="you@example.com" autoComplete="email"
                />
                {localErrors.email && touched.email && <p className={styles.fieldError}>{localErrors.email}</p>}
              </div>

              <div className={styles.fieldWrapper}>
                <label htmlFor="password" className={styles.fieldLabel}>Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => { setTouched((t) => ({ ...t, password: true })); validate(); }}
                    className={localErrors.password && touched.password ? `${styles.inputField} ${styles.inputInvalid}` : styles.inputField}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    autoComplete={userLoginMethod ? "current-password" : "new-password"}
                  />
                  <button
                    type="button" className={styles.eyeToggle}
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {localErrors.password && touched.password && <p className={styles.fieldError}>{localErrors.password}</p>}
              </div>

              <button type="submit" className={styles.submitButton} disabled={authState.isLoading}>
                {authState.isLoading ? (
                  <span className={styles.loader} aria-hidden />
                ) : userLoginMethod ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className={styles.dividerRow}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <span className={styles.dividerLine} />
            </div>

            <button type="button" className={styles.googleBtn} onClick={handleGoogleLogin}>
              <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className={styles.altAction}>
              {userLoginMethod ? (
                <p>New here?{" "}
                  <button type="button" onClick={() => setUserLoginMethod(false)} className={styles.inlineLink}>Create an account</button>
                </p>
              ) : (
                <p>Already have an account?{" "}
                  <button type="button" onClick={() => setUserLoginMethod(true)} className={styles.inlineLink}>Sign in</button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default LoginComponent;
