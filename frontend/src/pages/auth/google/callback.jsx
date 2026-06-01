import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { clientServer } from "@/config";

export default function GoogleCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing sign-in...");

  useEffect(() => {
    const { code, error } = router.query;

    if (error) {
      setStatus("Google sign-in was cancelled.");
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    if (!code) return;

    (async () => {
      try {
        const res = await clientServer.post("/auth/google", { code });
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          router.push("/dashboard");
        } else {
          setStatus("Authentication failed. Redirecting...");
          setTimeout(() => router.push("/login"), 2000);
        }
      } catch (err) {
        const msg = err.response?.data?.message || "Authentication failed";
        setStatus(msg + ". Redirecting...");
        setTimeout(() => router.push("/login"), 3000);
      }
    })();
  }, [router.query]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#faf7f9", fontFamily: "inherit",
    }}>
      <div style={{
        textAlign: "center", padding: "2rem", background: "#fff",
        borderRadius: "20px", boxShadow: "0 4px 24px rgba(177,33,103,0.12)",
        maxWidth: "400px",
      }}>
        <div style={{
          width: 40, height: 40, border: "4px solid #e6d2db",
          borderTopColor: "#b12167", borderRadius: "50%",
          animation: "goog-spin 0.8s linear infinite",
          margin: "0 auto 1rem",
        }} />
        <p style={{ color: "#6a5162", fontSize: "0.9rem" }}>{status}</p>
      </div>
    </div>
  );
}
