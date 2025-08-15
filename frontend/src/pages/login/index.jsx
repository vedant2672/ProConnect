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

  // false => Sign Up, true => Sign In
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
      // sign up extra validations
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
                className={
                  userLoginMethod ? styles.modeInactive : styles.modeActive
                }
                onClick={() => setUserLoginMethod(false)}
                type="button"
              >
                Sign Up
              </button>
              <button
                className={
                  userLoginMethod ? styles.modeActive : styles.modeInactive
                }
                onClick={() => setUserLoginMethod(true)}
                type="button"
              >
                Sign In
              </button>
            </div>

            {statusMessage && (
              <div
                className={
                  authState.isError
                    ? styles.feedbackError
                    : styles.feedbackSuccess
                }
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
                    <label htmlFor="username" className={styles.fieldLabel}>
                      Username
                    </label>
                    <input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onBlur={() => {
                        setTouched((t) => ({ ...t, username: true }));
                        validate();
                      }}
                      className={
                        localErrors.username && touched.username
                          ? `${styles.inputField} ${styles.inputInvalid}`
                          : styles.inputField
                      }
                      type="text"
                      placeholder="Choose a username"
                      autoComplete="username"
                    />
                    {localErrors.username && touched.username && (
                      <p className={styles.fieldError}>
                        {localErrors.username}
                      </p>
                    )}
                  </div>
                  <div className={styles.fieldWrapper}>
                    <label htmlFor="name" className={styles.fieldLabel}>
                      Name
                    </label>
                    <input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => {
                        setTouched((t) => ({ ...t, name: true }));
                        validate();
                      }}
                      className={
                        localErrors.name && touched.name
                          ? `${styles.inputField} ${styles.inputInvalid}`
                          : styles.inputField
                      }
                      type="text"
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                    {localErrors.name && touched.name && (
                      <p className={styles.fieldError}>{localErrors.name}</p>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.fieldWrapper}>
                <label htmlFor="email" className={styles.fieldLabel}>
                  Email
                </label>
                <input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    setTouched((t) => ({ ...t, email: true }));
                    validate();
                  }}
                  className={
                    localErrors.email && touched.email
                      ? `${styles.inputField} ${styles.inputInvalid}`
                      : styles.inputField
                  }
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {localErrors.email && touched.email && (
                  <p className={styles.fieldError}>{localErrors.email}</p>
                )}
              </div>

              <div className={styles.fieldWrapper}>
                <label htmlFor="password" className={styles.fieldLabel}>
                  Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => {
                      setTouched((t) => ({ ...t, password: true }));
                      validate();
                    }}
                    className={
                      localErrors.password && touched.password
                        ? `${styles.inputField} ${styles.inputInvalid}`
                        : styles.inputField
                    }
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete={
                      userLoginMethod ? "current-password" : "new-password"
                    }
                  />
                  <button
                    type="button"
                    className={styles.eyeToggle}
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {localErrors.password && touched.password && (
                  <p className={styles.fieldError}>{localErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={authState.isLoading}
              >
                {authState.isLoading ? (
                  <span className={styles.loader} aria-hidden />
                ) : userLoginMethod ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className={styles.altAction}>
              {userLoginMethod ? (
                <p>
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => setUserLoginMethod(false)}
                    className={styles.inlineLink}
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setUserLoginMethod(true)}
                    className={styles.inlineLink}
                  >
                    Sign in
                  </button>
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
